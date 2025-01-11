"use client";

import { Button } from "@/components/ui/button";
import { ImagePlusIcon, TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { renderDate } from "../../helpers/date-utils";
import { WrapInTooltip } from "../../helpers/components";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MomentBlock_Images, MomentBlock_Journal } from "@/convex/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useDropzone } from "react-dropzone";
import { getWeekBoxCustomColor } from "@/app/helpers/colors";

type Moment = NonNullable<
  typeof api.myFunctions.getMomentForYearWeek._returnType
>;

function DeleteBlock({ momentBlockId }: { momentBlockId: Id<"momentBlocks"> }) {
  const deleteMomentBlock = useMutation(api.blocks.deleteMomentBlock);

  return (
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
  );
}

function BlockContainer({
  momentBlockId,
  momentBlockCreationTime,
  children,
  isMobile,
}: {
  momentBlockId: Id<"momentBlocks">;
  momentBlockCreationTime: number;
  children: React.ReactNode;
  isMobile: boolean;
}) {
  const [isHovering, setIsHovering] = useState(false);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex flex-row gap-2 items-center">
          <DeleteBlock momentBlockId={momentBlockId} />

          <div>
            <Badge variant="outline">
              {renderDate(new Date(momentBlockCreationTime), "MM/DD/YY HH:MM")}
            </Badge>
          </div>
        </div>
        {children}
      </div>
    );
  }

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

          <DeleteBlock momentBlockId={momentBlockId} />
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
  isMobile,
}: {
  imagesBlock: MomentBlock_Images;
  isMobile: boolean;
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
      isMobile={isMobile}
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
  isMobile,
}: {
  journalBlock: MomentBlock_Journal;
  isMobile: boolean;
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
      isMobile={isMobile}
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

function EditName({ moment, isMobile }: { moment: Moment; isMobile: boolean }) {
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
    <Input
      value={name}
      onChange={(e) => {
        setName(e.target.value);
        debouncedSendRequest(e.target.value);
      }}
      className={cn(
        "font-bold",
        !isMobile &&
          "w-full rounded-none border-0 shadow-none focus-visible:ring-0 p-0 h-16 text-4xl"
      )}
      placeholder="something big"
    />
  );
}

export function MomentComponent({
  moment,
  isMobile,
}: {
  moment: Moment;
  isMobile: boolean;
}) {
  return (
    <>
      <div className="contents">
        <div
          className={cn(
            "h-1",
            moment.color && getWeekBoxCustomColor(moment.color)
          )}
        />

        <div />

        <EditName moment={moment} isMobile={isMobile} />
      </div>

      {moment.momentBlocks.map((block) => {
        if (block.type === "journal")
          return (
            <JournalBlockComponent
              journalBlock={block}
              key={block.momentBlockId}
              isMobile={isMobile}
            />
          );
        if (block.type === "images")
          return (
            <ImagesBlockComponent
              imagesBlock={block}
              key={block.momentBlockId}
              isMobile={isMobile}
            />
          );
      })}
    </>
  );
}
