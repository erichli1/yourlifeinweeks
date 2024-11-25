"use client";

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import {
  ImagePlusIcon,
  ImagesIcon,
  NotebookPenIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDatesFromWeekNumber,
  renderDate,
  YearWeek,
} from "./helpers/date-utils";
import { WrapInTooltip } from "./helpers/components";
import { User } from "./helpers/utils";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Color,
  COLORS,
  MomentBlock_Images,
  MomentBlock_Journal,
} from "@/convex/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useDropzone } from "react-dropzone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getWeekBoxCustomColor } from "./helpers/colors";

type Moment = NonNullable<
  typeof api.myFunctions.getMomentForYearWeek._returnType
>;

function BlockContainer({
  momentBlockId,
  momentBlockCreationTime,
  children,
}: {
  momentBlockId: Id<"momentBlocks">;
  momentBlockCreationTime: number;
  children: React.ReactNode;
}) {
  const deleteMomentBlock = useMutation(api.blocks.deleteMomentBlock);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="contents"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering ? (
        <div className="flex items-start justify-end pr-2">
          {/* <WrapInTooltip text="Add entry" delayDuration={0}>
            <Button
              variant="ghost"
              onClick={() => {
                createJournalEntry({ momentId }).catch(console.error);
              }}
              className="w-auto p-0"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip> */}

          <WrapInTooltip text="Delete entry" delayDuration={0} asChild>
            <Button
              variant="ghost"
              onClick={() => {
                deleteMomentBlock({
                  momentBlockId,
                }).catch(console.error);
              }}
              className="w-auto p-0"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </WrapInTooltip>
        </div>
      ) : (
        <div />
      )}
      <div className={"flex flex-col gap-2 pt-1"}>
        <div>
          <Badge variant="outline">
            {renderDate(new Date(momentBlockCreationTime), "MM/DD/YY HH:MM")}
          </Badge>
        </div>
        {children}
      </div>
    </div>
  );
}

function UploadedImage({
  imageId,
  url,
}: {
  imageId: Id<"images">;
  url: string;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const deleteImage = useMutation(api.blocks.deleteImage);

  return (
    <div
      className="w-32 h-32 transition-colors relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img
        src={url}
        className={cn(
          "w-full h-full object-cover rounded-md",
          isHovering && "opacity-60"
        )}
        alt="uploaded image"
      />

      {isHovering && (
        <div className="absolute bottom-0 right-0">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-transparent"
            onClick={() => {
              deleteImage({ imageId }).catch(console.error);
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ImagesBlockComponent({
  imagesBlock,
}: {
  imagesBlock: MomentBlock_Images;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveStorageId = useMutation(api.files.saveStorageId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.map((file) => {
        (async () => {
          const url = await generateUploadUrl();

          const result = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          const { storageId } = await result.json();
          await saveStorageId({
            storageId,
            imagesBlockId: imagesBlock.imagesBlockId,
          });
        })().catch(console.error);
      });
    },
    [generateUploadUrl, saveStorageId, imagesBlock.imagesBlockId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <BlockContainer
      momentBlockId={imagesBlock.momentBlockId}
      momentBlockCreationTime={imagesBlock.momentBlockCreationTime}
    >
      <div className="w-full flex flex-row gap-2 flex-wrap">
        {imagesBlock.images.map((image) => (
          <UploadedImage
            key={image.imageId}
            imageId={image.imageId}
            url={image.url}
          />
        ))}

        <div
          {...getRootProps()}
          className={cn(
            "w-32 h-32",
            "border-2 border-dashed rounded-md flex flex-col items-center justify-center",
            "cursor-pointer transition-colors",
            "group",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          )}
        >
          <input {...getInputProps()} accept="image/*" />
          <ImagePlusIcon className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </BlockContainer>
  );
}

function JournalBlockComponent({
  journalBlock,
}: {
  journalBlock: MomentBlock_Journal;
}) {
  const [entry, setEntry] = useState(journalBlock.entry);
  const updateJournalBlock = useMutation(api.blocks.updateJournalBlock);

  useEffect(() => {
    setEntry(journalBlock.entry);
  }, [journalBlock.entry]);

  const updateJournalEntryCallback = useCallback(
    (value: string) => {
      updateJournalBlock({
        journalBlockId: journalBlock.journalBlockId,
        entry: value,
      }).catch(console.error);
    },
    [journalBlock.journalBlockId, updateJournalBlock]
  );

  const debouncedUpdateJournalEntry = useMemo(() => {
    return debounce(updateJournalEntryCallback, 1000);
  }, [updateJournalEntryCallback]);

  return (
    <BlockContainer
      momentBlockId={journalBlock.momentBlockId}
      momentBlockCreationTime={journalBlock.momentBlockCreationTime}
    >
      <Textarea
        className="resize-none border-0 shadow-none focus-visible:ring-0 pl-0 py-0"
        rows={1}
        autoSize
        placeholder="what's on your mind?"
        value={entry}
        onChange={(e) => {
          setEntry(e.target.value);
          debouncedUpdateJournalEntry(e.target.value);
        }}
      />
    </BlockContainer>
  );
}

function MomentComponent({ moment }: { moment: Moment }) {
  const [name, setName] = useState(moment.name);
  const renameMoment = useMutation(api.myFunctions.renameMoment);

  useEffect(() => {
    setName(moment.name);
  }, [moment.name]);

  const sendRequest = useCallback(
    (value: string) => {
      renameMoment({ momentId: moment._id, name: value }).catch(console.error);
    },
    [moment._id, renameMoment]
  );

  const debouncedSendRequest = useMemo(() => {
    return debounce(sendRequest, 500);
  }, [sendRequest]);

  return (
    <>
      <div className="contents">
        <div />

        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            debouncedSendRequest(e.target.value);
          }}
          className={cn(
            "w-full rounded-none font-bold border-0 shadow-none focus-visible:ring-0 p-0",
            "h-16 text-4xl"
          )}
          placeholder="something big"
        />
      </div>

      {moment.momentBlocks.map((block) => {
        if (block.type === "journal")
          return (
            <JournalBlockComponent
              journalBlock={block}
              key={block.momentBlockId}
            />
          );
        if (block.type === "images")
          return (
            <ImagesBlockComponent
              imagesBlock={block}
              key={block.momentBlockId}
            />
          );
      })}
    </>
  );
}

const COLOR_CIRCLE_CLASSES = "w-4 h-4 rounded-full";

function ColorPicker({
  selectedColor,
  momentId,
}: {
  selectedColor?: Color;
  momentId: Id<"moments">;
}) {
  const updateColor = useMutation(api.myFunctions.updateColor);

  return (
    <Popover modal>
      <WrapInTooltip text="Change color" delayDuration={0} asChild>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <div
              className={cn(
                COLOR_CIRCLE_CLASSES,
                selectedColor
                  ? getWeekBoxCustomColor(selectedColor)
                  : "border-2 border-filled"
              )}
            />
          </Button>
        </PopoverTrigger>
      </WrapInTooltip>
      <PopoverContent className="bg-background w-fit max-w-xs mx-1 p-2">
        <div className="flex flex-row flex-wrap gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              updateColor({ momentId, color: undefined }).catch(console.error);
            }}
          >
            <div
              className={cn(COLOR_CIRCLE_CLASSES, "border-2 border-filled")}
            />
          </Button>

          {COLORS.map((color) => (
            <Button
              variant="outline"
              key={`color-picker-option-${color}`}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                updateColor({ momentId, color }).catch(console.error);
              }}
            >
              <div
                className={cn(
                  COLOR_CIRCLE_CLASSES,
                  getWeekBoxCustomColor(color)
                )}
              />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AuthenticatedWeekContentWithMoment({
  user,
  yearWeek,
  moment,
}: {
  user: User;
  yearWeek: YearWeek;
  moment: Moment;
}) {
  const createJournalBlock = useMutation(api.blocks.createJournalBlock);
  const createImagesBlock = useMutation(api.blocks.createImagesBlock);
  const deleteMoment = useMutation(api.myFunctions.deleteMoment);
  const updateDisplayName = useMutation(api.myFunctions.updateDisplayName);
  const [displayName, setDisplayName] = useState(moment.displayName);

  useEffect(() => {
    setDisplayName(moment.displayName);
  }, [moment.displayName]);

  const sendRequest = useCallback(
    (value: string) => {
      updateDisplayName({ momentId: moment._id, displayName: value }).catch(
        console.error
      );
    },
    [moment._id, updateDisplayName]
  );

  const debouncedSendRequest = useMemo(() => {
    return debounce(sendRequest, 500);
  }, [sendRequest]);

  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek} color={moment.color}>
      <div className="col-span-2 overflow-y-auto">
        <div className="grid grid-cols-[3rem_1fr] gap-y-3">
          <MomentComponent moment={moment} />
        </div>
      </div>

      <div />
      <div>
        <Separator className="my-2" />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <WrapInTooltip text="Add journal entry" delayDuration={0} asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  createJournalBlock({ momentId: moment._id }).catch(
                    console.error
                  );
                }}
              >
                <NotebookPenIcon className="w-4 h-4 mr-1" />
                Journal
              </Button>
            </WrapInTooltip>

            <WrapInTooltip text="Add images" delayDuration={0} asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  createImagesBlock({ momentId: moment._id }).catch(
                    console.error
                  );
                }}
              >
                <ImagesIcon className="w-4 h-4 mr-1" />
                Images
              </Button>
            </WrapInTooltip>
          </div>

          <div className="flex flex-row gap-2">
            <WrapInTooltip text="Edit display name" delayDuration={0}>
              <Input
                placeholder="name"
                className="h-8 text-xs"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  debouncedSendRequest(e.target.value);
                }}
              />
            </WrapInTooltip>

            <ColorPicker momentId={moment._id} selectedColor={moment.color} />

            <div>
              <WrapInTooltip text="Delete moment" delayDuration={0} asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    deleteMoment({ momentId: moment._id }).catch(console.error);
                  }}
                  className="h-8 w-8"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </WrapInTooltip>
            </div>
          </div>
        </div>
      </div>
    </WeekSheetContainer>
  );
}

function AuthenticatedWeekContentWithNoMoment({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const createMoment = useMutation(api.myFunctions.createMomentForYearWeek);

  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek}>
      <div />
      <div className="h-full flex items-center justify-center">
        <Button
          variant="outline"
          onClick={() => {
            createMoment({
              year: yearWeek.year,
              week: yearWeek.week,
              name: "",
            }).catch(console.error);
          }}
        >
          add a moment
        </Button>
      </div>
    </WeekSheetContainer>
  );
}

function AuthenticatedWeekContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  const moment = useQuery(api.myFunctions.getMomentForYearWeek, {
    year: yearWeek.year,
    week: yearWeek.week,
  });

  if (moment === undefined) return <></>;

  if (moment === null)
    return (
      <AuthenticatedWeekContentWithNoMoment user={user} yearWeek={yearWeek} />
    );

  return (
    <AuthenticatedWeekContentWithMoment
      user={user}
      yearWeek={yearWeek}
      moment={moment}
    />
  );
}

function UnauthenticatedWeekContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  return (
    <WeekSheetContainer user={user} yearWeek={yearWeek}>
      <div />
      <div className="h-full flex items-center justify-center">
        <p>
          <SignInButton
            mode="modal"
            redirectUrl={window ? window.location.href : undefined}
          >
            <span className="underline cursor-pointer">Sign in</span>
          </SignInButton>{" "}
          to add moments
        </p>
      </div>
    </WeekSheetContainer>
  );
}

function WeekSheetContainer({
  user,
  yearWeek,
  children,
  color,
}: {
  user: User;
  yearWeek: YearWeek;
  children: React.ReactNode;
  color?: Color;
}) {
  const { start, end } = getDatesFromWeekNumber({
    birthday: user.birthday,
    yearWeek,
  });

  return (
    <>
      <div className={cn("h-1", color && getWeekBoxCustomColor(color))} />
      <div className="h-full py-4 pr-4">
        <div className="grid grid-cols-[3rem_1fr] pt-4 pr-4 grid-rows-[auto_1fr_auto] h-full">
          <div />
          <div>
            <div className="flex flex-row gap-1 justify-between items-center">
              <div className="flex flex-row gap-1 items-center">
                <div>
                  Year {yearWeek.year}, Week {yearWeek.week}
                </div>
              </div>
              <div>
                {renderDate(start, "MM/DD/YY")} - {renderDate(end, "MM/DD/YY")}
              </div>
            </div>
            <Separator className="my-2" />
          </div>

          {children}
        </div>
      </div>
    </>
  );
}

export function WeekSheetContent({
  user,
  yearWeek,
}: {
  user: User;
  yearWeek: YearWeek;
}) {
  return user.signedIn ? (
    <AuthenticatedWeekContent user={user} yearWeek={yearWeek} />
  ) : (
    <UnauthenticatedWeekContent user={user} yearWeek={yearWeek} />
  );
}
