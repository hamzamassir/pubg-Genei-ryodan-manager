"use client";

import { deactivateSurveyAction } from "@/app/actions";

export function ConfirmCloseSurvey({ surveyId }: { surveyId: number }) {
  return (
    <form
      action={deactivateSurveyAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Close this survey for ALL players? They will not be able to submit until you launch again.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="surveyId" value={surveyId} />
      <button type="submit" className="btn btn-danger text-sm">
        Close survey
      </button>
    </form>
  );
}
