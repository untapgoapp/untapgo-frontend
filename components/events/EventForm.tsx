"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LocationPicker, {
  type LocationValue,
} from "@/components/location/LocationPicker";
import {
  createEvent,
  updateEvent,
  type AttendanceMethod,
  type EventItem,
} from "@/services/events";

const FORMAT_OPTIONS = [
  { value: "commander", label: "Commander" },
  { value: "cube", label: "Cube" },
  { value: "draft", label: "Draft" },
  { value: "legacy", label: "Legacy" },
  { value: "modern", label: "Modern" },
  { value: "pauper", label: "Pauper" },
  { value: "pioneer", label: "Pioneer" },
  { value: "premodern", label: "Premodern" },
  { value: "sealed", label: "Sealed" },
  { value: "standard", label: "Standard" },
  { value: "vintage", label: "Vintage" },
  { value: "other", label: "Other" },
];

const POWER_OPTIONS = [
  { value: "Casual", label: "Casual" },
  { value: "Optimized", label: "Optimized" },
  { value: "Competitive", label: "Competitive" },
  { value: "cEDH", label: "cEDH" },
];

const PROXIES_OPTIONS = [
  { value: "Ask", label: "Ask host" },
  { value: "Yes", label: "Allowed" },
  { value: "No", label: "Not allowed" },
];

const ATTENDANCE_OPTIONS = [
  {
    value: "none",
    label: "No verification",
  },
  {
    value: "host",
    label: "Host visual check-in",
  },
  {
    value: "qr",
    label: "QR check-in",
  },
];

const DURATION_OPTIONS = [
  { value: "60", label: "1 hour" },
  { value: "90", label: "1 hour 30 minutes" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "300", label: "5 hours" },
  { value: "360", label: "6 hours" },
];

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-black/20 focus:border-[#6E5AA7] focus:ring-4 focus:ring-[#6E5AA7]/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

const labelClass =
  "grid gap-2";

const labelTextClass =
  "text-sm font-semibold text-zinc-800";

const helperTextClass =
  "text-xs leading-5 text-zinc-500";

type EditableEventItem =
  EventItem & {
    description?: string | null;
  };

type EventFormProps = {
  mode: "create" | "edit";
  initialEvent?: EditableEventItem | null;
};

function getDefaultDateTimeLocal(): string {
  const date = new Date();

  date.setHours(
    date.getHours() + 2,
  );

  date.setMinutes(0, 0, 0);

  return toDateTimeLocal(
    date.toISOString(),
  );
}

function toDateTimeLocal(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const offsetMs =
    date.getTimezoneOffset() *
    60 *
    1000;

  const localDate = new Date(
    date.getTime() - offsetMs,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getString(
  form: FormData,
  key: string,
): string {
  return String(
    form.get(key) ?? "",
  ).trim();
}

function getInteger(
  form: FormData,
  key: string,
  fallback: number,
): number {
  const value = Number(
    form.get(key),
  );

  if (
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.trunc(value);
}

function getInitialLocation(
  event?: EventItem | null,
): LocationValue | null {
  if (!event) {
    return null;
  }

  if (
    event.lat === null ||
    event.lat === undefined ||
    event.lng === null ||
    event.lng === undefined
  ) {
    return null;
  }

  const lat = Number(event.lat);
  const lng = Number(event.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    address_text:
      event.address_text ||
      "Event location",
    place_id:
      event.place_id ||
      "saved-location",
    lat,
    lng,
  };
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not save event.";

  const normalized =
    message.toUpperCase();

  const knownErrors: Array<{
    code: string;
    message: string;
  }> = [
    {
      code: "NOT_HOST",
      message:
        "Only the event host can edit this event.",
    },
    {
      code: "EVENT_NOT_FOUND",
      message:
        "This event could not be found.",
    },
    {
      code: "EVENT_NOT_EDITABLE",
      message:
        "This event can no longer be edited.",
    },
    {
      code: "FORMAT_SLUG_INVALID",
      message:
        "The selected format is not available.",
    },
    {
      code: "FORMAT_SLUG_REQUIRED",
      message:
        "Choose a format for the event.",
    },
    {
      code: "HOST_NOTES_TOO_LONG",
      message:
        "Host notes cannot exceed 1,500 characters.",
    },
    {
      code: "MAX_PLAYERS",
      message:
        "The number of players is not valid.",
    },
    {
      code: "ATTENDANCE_METHOD_INVALID",
      message:
        "Choose a valid attendance verification method.",
    },
    {
      code: "WALK_INS_REQUIRE_QR",
      message:
        "QR check-in is required to allow walk-ins.",
    },
  ];

  const match =
    knownErrors.find(
      ({ code }) =>
        normalized.includes(code),
    );

  if (match) {
    return match.message;
  }

  if (
    !message ||
    message === "[object Object]"
  ) {
    return "Could not save event.";
  }

  return message;
}

export default function EventForm({
  mode,
  initialEvent,
}: EventFormProps) {
  const router = useRouter();

  const isEdit =
    mode === "edit";

  const [location, setLocation] =
    useState<LocationValue | null>(
      getInitialLocation(
        initialEvent,
      ),
    );

  const [
    attendanceMethod,
    setAttendanceMethod,
  ] = useState<AttendanceMethod>(
    initialEvent?.attendance_method ??
      "none",
  );

  const [
    allowWalkIns,
    setAllowWalkIns,
  ] = useState(
    Boolean(
      initialEvent?.allow_walk_ins,
    ),
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const submitLabel =
    useMemo(() => {
      if (loading) {
        return isEdit
          ? "Saving changes..."
          : "Creating event...";
      }

      return isEdit
        ? "Save changes"
        : "Create event";
    }, [isEdit, loading]);

  const cancelHref =
    isEdit && initialEvent?.id
      ? `/events/${initialEvent.id}`
      : "/events";

  async function handleSubmit(
    submitEvent: FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    if (loading) {
      return;
    }

    const form = new FormData(
      submitEvent.currentTarget,
    );

    const title =
      getString(form, "title");

    const description =
      getString(
        form,
        "description",
      );

    const dateTime =
      getString(
        form,
        "starts_at",
      );

    const hostNotes =
      getString(
        form,
        "host_notes",
      );

    const durationMinutes =
      getInteger(
        form,
        "duration_minutes",
        180,
      );

    const maxPlayers =
      getInteger(
        form,
        "max_players",
        4,
      );

    if (!title) {
      setError(
        "Title is required.",
      );

      return;
    }

    if (title.length > 120) {
      setError(
        "Title cannot exceed 120 characters.",
      );

      return;
    }

    if (
      description.length > 5000
    ) {
      setError(
        "Description cannot exceed 5,000 characters.",
      );

      return;
    }

    if (
      hostNotes.length > 1500
    ) {
      setError(
        "Host notes cannot exceed 1,500 characters.",
      );

      return;
    }

    if (!dateTime) {
      setError(
        "Date and time are required.",
      );

      return;
    }

    const startsAt =
      new Date(dateTime);

    if (
      Number.isNaN(
        startsAt.getTime(),
      )
    ) {
      setError(
        "Date and time are invalid.",
      );

      return;
    }

    if (
      startsAt.getTime() <=
      Date.now()
    ) {
      setError(
        "The event must start in the future.",
      );

      return;
    }

    if (
      durationMinutes < 15 ||
      durationMinutes > 1440
    ) {
      setError(
        "Duration must be between 15 minutes and 24 hours.",
      );

      return;
    }

    if (
      maxPlayers < 2 ||
      maxPlayers > 200
    ) {
      setError(
        "Maximum players must be between 2 and 200.",
      );

      return;
    }

    const confirmedPlayers =
      Number(
        initialEvent?.attendees_count ??
          0,
      );

    if (
      isEdit &&
      maxPlayers <
        confirmedPlayers
    ) {
      setError(
        `Maximum players cannot be lower than the ${confirmedPlayers} player${
          confirmedPlayers === 1
            ? ""
            : "s"
        } already confirmed.`,
      );

      return;
    }

    if (
      allowWalkIns &&
      attendanceMethod !== "qr"
    ) {
      setError(
        "QR check-in is required to allow walk-ins.",
      );

      return;
    }

    if (!location) {
      setError(
        "Location is required. Choose one from the search results.",
      );

      return;
    }

    if (
      !Number.isFinite(
        location.lat,
      ) ||
      !Number.isFinite(
        location.lng,
      )
    ) {
      setError(
        "The selected location does not have valid coordinates.",
      );

      return;
    }

    setLoading(true);
    setError(null);

    const basePayload = {
      title,
      description,
      starts_at:
        startsAt.toISOString(),
      duration_minutes:
        durationMinutes,
      max_players: maxPlayers,
      format_slug:
        getString(
          form,
          "format_slug",
        ) || "commander",

      address_text:
        location.address_text,
      place_id:
        location.place_id,
      lat: location.lat,
      lng: location.lng,

      power_level:
        getString(
          form,
          "power_level",
        ) || "Casual",

      proxies_policy:
        getString(
          form,
          "proxies_policy",
        ) || "Ask",

      host_notes:
        hostNotes || null,

      attendance_method:
        attendanceMethod,
      allow_walk_ins:
        attendanceMethod === "qr"
          ? allowWalkIns
          : false,
    };

    try {
      if (isEdit) {
        if (!initialEvent?.id) {
          throw new Error(
            "Missing event ID.",
          );
        }

        const updated =
          await updateEvent(
            initialEvent.id,
            basePayload,
          );

        const updatedId =
          updated.id ||
          initialEvent.id;

        router.push(
          `/events/${updatedId}`,
        );

        router.refresh();

        return;
      }

      const createPayload = {
        ...basePayload,
        host_notes:
          hostNotes || undefined,
        auto_join:
          form.get(
            "auto_join",
          ) === "on",
      };

      const created =
        await createEvent(
          createPayload,
        );

      if (!created?.id) {
        throw new Error(
          "The event was created, but its ID was not returned.",
        );
      }

      router.push(
        `/events/${created.id}`,
      );

      router.refresh();
    } catch (saveError) {
      setError(
        getErrorMessage(
          saveError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6"
    >
      <section className="grid gap-5 rounded-[1.35rem] border border-black/10 bg-white p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Event details
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
            What are you playing?
          </h2>
        </div>

        <label
          className={labelClass}
        >
          <span
            className={
              labelTextClass
            }
          >
            Title
          </span>

          <input
            name="title"
            required
            maxLength={120}
            disabled={loading}
            defaultValue={
              initialEvent?.title ??
              ""
            }
            placeholder="Friday Commander Night"
            className={
              inputClass
            }
          />
        </label>

        <label
          className={labelClass}
        >
          <span
            className={
              labelTextClass
            }
          >
            Description
          </span>

          <textarea
            name="description"
            rows={5}
            maxLength={5000}
            disabled={loading}
            defaultValue={
              initialEvent?.description ??
              ""
            }
            placeholder="Tell players what kind of table this is, what to bring, and who it is suitable for."
            className={
              inputClass
            }
          />

          <p
            className={
              helperTextClass
            }
          >
            This appears publicly
            on the event page.
          </p>
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            name="format_slug"
            label="Format"
            disabled={loading}
            defaultValue={
              initialEvent?.format_slug ||
              "commander"
            }
            options={
              FORMAT_OPTIONS
            }
          />

          <SelectField
            name="power_level"
            label="Power"
            disabled={loading}
            defaultValue={
              initialEvent?.power_level ||
              "Casual"
            }
            options={
              POWER_OPTIONS
            }
          />

          <SelectField
            name="proxies_policy"
            label="Proxies"
            disabled={loading}
            defaultValue={
              initialEvent?.proxies_policy ||
              "Ask"
            }
            options={
              PROXIES_OPTIONS
            }
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-[1.35rem] border border-black/10 bg-white p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Time and place
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
            When and where?
          </h2>
        </div>

        <LocationPicker
          value={location}
          onChange={(value) => {
            setLocation(value);
            setError(null);
          }}
          label="Location"
          placeholder="Search for a store, cafe or address..."
        />

        {!location &&
        initialEvent?.address_text ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              Current saved location
            </p>

            <p className="mt-1">
              {
                initialEvent.address_text
              }
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Choose a location
              from the search results
              to attach valid map
              coordinates.
            </p>
          </div>
        ) : null}

        <label
          className={labelClass}
        >
          <span
            className={
              labelTextClass
            }
          >
            Date and time
          </span>

          <input
            name="starts_at"
            type="datetime-local"
            required
            disabled={loading}
            defaultValue={
              initialEvent?.starts_at
                ? toDateTimeLocal(
                    initialEvent.starts_at,
                  )
                : getDefaultDateTimeLocal()
            }
            className={
              inputClass
            }
          />

          <p
            className={
              helperTextClass
            }
          >
            The time is entered
            in your current local
            timezone.
          </p>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="duration_minutes"
            label="Duration"
            disabled={loading}
            defaultValue={String(
              initialEvent?.duration_minutes ||
                180,
            )}
            options={
              DURATION_OPTIONS
            }
          />

          <label
            className={
              labelClass
            }
          >
            <span
              className={
                labelTextClass
              }
            >
              Max players
            </span>

            <input
              name="max_players"
              type="number"
              min={2}
              max={200}
              step={1}
              required
              disabled={loading}
              defaultValue={
                initialEvent?.max_players ||
                4
              }
              className={
                inputClass
              }
            />

            {isEdit &&
            Number(
              initialEvent?.attendees_count ??
                0,
            ) > 0 ? (
              <p
                className={
                  helperTextClass
                }
              >
                {
                  initialEvent
                    ?.attendees_count
                }{" "}
                player
                {initialEvent
                  ?.attendees_count ===
                1
                  ? ""
                  : "s"}{" "}
                currently confirmed.
              </p>
            ) : null}
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-[1.35rem] border border-black/10 bg-white p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Host settings
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
            Final details
          </h2>
        </div>

        <div className="grid gap-4 rounded-2xl border border-black/10 bg-black/[0.025] p-4">
          <label className={labelClass}>
            <span className={labelTextClass}>
              Attendance verification
            </span>

            <select
              name="attendance_method"
              value={attendanceMethod}
              disabled={loading}
              onChange={(changeEvent) => {
                const nextMethod =
                  changeEvent.target.value as AttendanceMethod;

                setAttendanceMethod(
                  nextMethod,
                );

                if (
                  nextMethod !== "qr"
                ) {
                  setAllowWalkIns(
                    false,
                  );
                }

                setError(null);
              }}
              className={inputClass}
            >
              {ATTENDANCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <p className={helperTextClass}>
              {attendanceMethod === "none"
                ? "Attendance will not affect the future trust system for this event."
                : attendanceMethod === "host"
                  ? "The host visually confirms who attended."
                  : "Players check in using the event QR. The host can still correct attendance manually."}
            </p>
          </label>

          {attendanceMethod === "qr" ? (
            <label className="flex items-start justify-between gap-4 rounded-2xl border border-black/10 bg-white px-4 py-4">
              <div>
                <span className="text-sm font-semibold text-zinc-900">
                  Allow QR walk-ins
                </span>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Players who are not already confirmed may take an available seat by scanning the QR.
                </p>
              </div>

              <input
                name="allow_walk_ins"
                type="checkbox"
                checked={allowWalkIns}
                disabled={loading}
                onChange={(changeEvent) => {
                  setAllowWalkIns(
                    changeEvent.target.checked,
                  );
                  setError(null);
                }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#6E5AA7]"
              />
            </label>
          ) : null}

          {attendanceMethod === "qr" ? (
            <p className="rounded-2xl border border-[#6E5AA7]/15 bg-[#EEE9FF] px-4 py-3 text-xs leading-5 text-[#5F4E94]">
              QR generation and scanning are added in Attendance Phase A2. The method can already be selected and the host can verify attendance manually.
            </p>
          ) : null}
        </div>

        {!isEdit ? (
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-black/[0.025] px-4 py-4">
            <div>
              <span className="text-sm font-semibold text-zinc-900">
                I am playing in
                this event
              </span>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Turn this off when
                you are only
                organising the
                table, such as a
                store or tournament
                host.
              </p>
            </div>

            <input
              name="auto_join"
              type="checkbox"
              defaultChecked
              disabled={loading}
              className="h-5 w-5 shrink-0 accent-[#6E5AA7]"
            />
          </label>
        ) : null}

        <label
          className={labelClass}
        >
          <span
            className={
              labelTextClass
            }
          >
            Host notes
          </span>

          <textarea
            name="host_notes"
            rows={4}
            maxLength={1500}
            disabled={loading}
            defaultValue={
              initialEvent?.host_notes ??
              ""
            }
            placeholder="Bring sleeves. New players welcome. Ask the host before using proxies."
            className={
              inputClass
            }
          />

          <p
            className={
              helperTextClass
            }
          >
            Use this for practical
            instructions or table
            expectations.
          </p>
        </label>
      </section>

      {error ? (
        <ErrorBox
          message={error}
        />
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          aria-disabled={loading}
          className={[
            "inline-flex min-h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:text-black",
            loading
              ? "pointer-events-none opacity-50"
              : "",
          ].join(" ")}
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#6E5AA7] px-6 text-sm font-semibold text-white transition hover:bg-[#5F4E94] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
}) {
  return (
    <label
      className={labelClass}
    >
      <span
        className={
          labelTextClass
        }
      >
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={
          inputClass
        }
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
    >
      {message}
    </div>
  );
}