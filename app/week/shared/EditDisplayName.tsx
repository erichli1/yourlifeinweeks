"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { WrapInTooltip } from "../../helpers/components";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";

type Moment = NonNullable<
  typeof api.myFunctions.getMomentForYearWeek._returnType
>;

export function EditDisplayName({ moment }: { moment: Moment }) {
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
  );
}
