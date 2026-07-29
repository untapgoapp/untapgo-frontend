"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CircleMinus,
  EyeOff,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import {
  getEventFeedback,
  submitEventFeedback,
  type EventFeedbackContext,
  type EventFeedbackTarget,
  type FeedbackReasonCode,
  type FeedbackSentiment,
} from "@/services/events";

type EventFeedbackPanelProps = {
  eventId: string;
};

type Draft = {
  sentiment:
    | FeedbackSentiment
    | null;
  reasonCode:
    | FeedbackReasonCode
    | null;
};

const REASON_OPTIONS: Array<{
  value: FeedbackReasonCode;
  label: string;
}> = [
  {
    value: "late_arrival",
    label: "Late arrival",
  },
  {
    value: "poor_communication",
    label: "Poor communication",
  },
  {
    value: "disrespectful_behaviour",
    label: "Disrespectful behaviour",
  },
  {
    value: "event_details_inaccurate",
    label: "Event details were inaccurate",
  },
  {
    value: "host_absent",
    label: "Host did not appear",
  },
  {
    value: "unsafe_behaviour",
    label: "Unsafe behaviour or environment",
  },
  {
    value: "other",
    label: "Other",
  },
];

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function sentimentLabel(
  value?: FeedbackSentiment | null,
): string {
  if (value === "positive") {
    return "Positive";
  }

  if (value === "neutral") {
    return "Neutral";
  }

  if (value === "negative") {
    return "Negative";
  }

  return "Not submitted";
}

function reasonLabel(
  value?: FeedbackReasonCode | null,
): string | null {
  return (
    REASON_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? null
  );
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : "Could not save feedback.";

  const normalized =
    message.toUpperCase();

  const errors: Array<[
    string,
    string,
  ]> = [
    [
      "FEEDBACK_REASON_REQUIRED",
      "Choose a reason for negative feedback.",
    ],
    [
      "FEEDBACK_WINDOW_CLOSED",
      "The feedback window has closed.",
    ],
    [
      "FEEDBACK_NOT_OPEN",
      "Feedback opens after the event ends.",
    ],
    [
      "FEEDBACK_TARGET_NOT_ELIGIBLE",
      "This person is not eligible for feedback from this event.",
    ],
    [
      "FEEDBACK_REVIEWER_NOT_ELIGIBLE",
      "Verified attendance is required before leaving feedback.",
    ],
    [
      "ATTENDANCE_NOT_VERIFIED",
      "This event did not use verified attendance.",
    ],
  ];

  return (
    errors.find(
      ([code]) =>
        normalized.includes(
          code,
        ),
    )?.[1] ??
    message
  );
}

export default function EventFeedbackPanel({
  eventId,
}: EventFeedbackPanelProps) {
  const [context, setContext] =
    useState<EventFeedbackContext | null>(
      null,
    );

  const [drafts, setDrafts] =
    useState<Record<string, Draft>>(
      {},
    );

  const [loading, setLoading] =
    useState(true);

  const [
    savingUserId,
    setSavingUserId,
  ] = useState<string | null>(
    null,
  );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const loadFeedback =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getEventFeedback(
            eventId,
          );

        setContext(result);

        setDrafts(
          Object.fromEntries(
            result.targets.map(
              (target) => [
                target.user_id,
                {
                  sentiment:
                    target.my_sentiment ??
                    null,
                  reasonCode:
                    target.my_reason_code ??
                    null,
                },
              ],
            ),
          ),
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [eventId]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const hasVisibleContent =
    useMemo(
      () =>
        Boolean(
          context &&
          context.viewer_role !==
            "none" &&
          context.attendance_verified &&
          !context.event_cancelled,
        ),
      [context],
    );

  async function saveTarget(
    target: EventFeedbackTarget,
  ) {
    const draft =
      drafts[target.user_id];

    if (
      !draft?.sentiment ||
      savingUserId
    ) {
      return;
    }

    if (
      draft.sentiment ===
        "negative" &&
      !draft.reasonCode
    ) {
      setError(
        "Choose a reason for negative feedback.",
      );

      return;
    }

    setSavingUserId(
      target.user_id,
    );
    setError(null);

    try {
      await submitEventFeedback({
        eventId,
        revieweeId:
          target.user_id,
        sentiment:
          draft.sentiment,
        reasonCode:
          draft.reasonCode,
      });

      await loadFeedback();
    } catch (saveError) {
      setError(
        getErrorMessage(
          saveError,
        ),
      );
    } finally {
      setSavingUserId(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-black/10" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-black/[0.05]" />
      </section>
    );
  }

  if (
    !hasVisibleContent ||
    !context
  ) {
    return null;
  }

  return (
    <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Post-game feedback
        </p>

        <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
          How was the table?
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Feedback closes{" "}
          {formatDateTime(
            context.closes_at,
          )}
          .
        </p>
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl border border-[#6E5AA7]/15 bg-[#EEE9FF] px-4 py-3 text-xs leading-5 text-[#5F4E94]">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />

        <p>
          Feedback remains hidden until both people respond or the 72-hour window closes.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {error}
        </div>
      ) : null}

      {context.targets.length ===
      0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-black/15 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-zinc-700">
            No verified feedback targets
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Only checked-in or attended players can take part in post-game feedback.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {context.targets.map(
            (target) => {
              const draft =
                drafts[
                  target.user_id
                ] ?? {
                  sentiment: null,
                  reasonCode: null,
                };

              const isSaving =
                savingUserId ===
                target.user_id;

              const changed =
                draft.sentiment !==
                  (
                    target.my_sentiment ??
                    null
                  ) ||
                draft.reasonCode !==
                  (
                    target.my_reason_code ??
                    null
                  );

              return (
                <div
                  key={
                    target.user_id
                  }
                  className="rounded-2xl border border-black/10 bg-black/[0.018] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {target.nickname ||
                          (
                            target.role ===
                            "host"
                              ? "Event host"
                              : "Unnamed player"
                          )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {target.role ===
                        "host"
                          ? "Host"
                          : "Player"}
                        {target.attendance_status
                          ? ` · ${target.attendance_status.replaceAll(
                              "_",
                              " ",
                            )}`
                          : ""}
                      </p>
                    </div>

                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-[#6E5AA7]" />
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <SentimentButton
                      active={
                        draft.sentiment ===
                        "positive"
                      }
                      disabled={
                        !context.feedback_open ||
                        Boolean(
                          savingUserId,
                        )
                      }
                      icon={
                        <ThumbsUp
                          size={15}
                        />
                      }
                      label="Positive"
                      onClick={() => {
                        setDrafts(
                          (current) => ({
                            ...current,
                            [target.user_id]:
                              {
                                sentiment:
                                  "positive",
                                reasonCode:
                                  null,
                              },
                          }),
                        );
                      }}
                    />

                    <SentimentButton
                      active={
                        draft.sentiment ===
                        "neutral"
                      }
                      disabled={
                        !context.feedback_open ||
                        Boolean(
                          savingUserId,
                        )
                      }
                      icon={
                        <CircleMinus
                          size={15}
                        />
                      }
                      label="Neutral"
                      onClick={() => {
                        setDrafts(
                          (current) => ({
                            ...current,
                            [target.user_id]:
                              {
                                sentiment:
                                  "neutral",
                                reasonCode:
                                  null,
                              },
                          }),
                        );
                      }}
                    />

                    <SentimentButton
                      active={
                        draft.sentiment ===
                        "negative"
                      }
                      disabled={
                        !context.feedback_open ||
                        Boolean(
                          savingUserId,
                        )
                      }
                      icon={
                        <ThumbsDown
                          size={15}
                        />
                      }
                      label="Negative"
                      onClick={() => {
                        setDrafts(
                          (current) => ({
                            ...current,
                            [target.user_id]:
                              {
                                sentiment:
                                  "negative",
                                reasonCode:
                                  current[
                                    target.user_id
                                  ]
                                    ?.reasonCode ??
                                  null,
                              },
                          }),
                        );
                      }}
                    />
                  </div>

                  {draft.sentiment ===
                  "negative" ? (
                    <label className="mt-3 grid gap-2">
                      <span className="text-xs font-semibold text-zinc-600">
                        Reason
                      </span>

                      <select
                        value={
                          draft.reasonCode ??
                          ""
                        }
                        disabled={
                          !context.feedback_open ||
                          Boolean(
                            savingUserId,
                          )
                        }
                        onChange={(
                          changeEvent,
                        ) => {
                          setDrafts(
                            (current) => ({
                              ...current,
                              [target.user_id]:
                                {
                                  sentiment:
                                    "negative",
                                  reasonCode:
                                    (
                                      changeEvent
                                        .target
                                        .value ||
                                      null
                                    ) as
                                      | FeedbackReasonCode
                                      | null,
                                },
                            }),
                          );
                        }}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#6E5AA7]"
                      >
                        <option value="">
                          Choose a reason
                        </option>

                        {REASON_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                      Sent:{" "}
                      <span className="font-semibold text-zinc-700">
                        {sentimentLabel(
                          target.my_sentiment,
                        )}
                      </span>
                      {target.my_reason_code
                        ? ` · ${reasonLabel(
                            target.my_reason_code,
                          )}`
                        : ""}
                    </p>

                    {context.feedback_open ? (
                      <button
                        type="button"
                        disabled={
                          !draft.sentiment ||
                          !changed ||
                          Boolean(
                            savingUserId,
                          ) ||
                          (
                            draft.sentiment ===
                              "negative" &&
                            !draft.reasonCode
                          )
                        }
                        onClick={() => {
                          void saveTarget(
                            target,
                          );
                        }}
                        className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {target.my_sentiment
                          ? "Update"
                          : "Submit"}
                      </button>
                    ) : null}
                  </div>

                  {target.received_revealed &&
                  target.received_sentiment ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
                      Feedback received:{" "}
                      <span className="font-semibold">
                        {sentimentLabel(
                          target.received_sentiment,
                        )}
                      </span>
                      {target.received_reason_code
                        ? ` · ${reasonLabel(
                            target.received_reason_code,
                          )}`
                        : ""}
                    </div>
                  ) : null}
                </div>
              );
            },
          )}
        </div>
      )}

      {!context.feedback_open ? (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          The feedback window is closed. Revealed feedback remains visible here.
        </p>
      ) : null}
    </section>
  );
}

function SentimentButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-[#6E5AA7]/30 bg-[#EEE9FF] text-[#6E5AA7]"
          : "border-black/10 bg-white text-zinc-600 hover:border-black/20 hover:text-black",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
