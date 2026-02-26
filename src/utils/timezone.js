const UZBEKISTAN_TIME_ZONE = "Asia/Tashkent";

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return parts.reduce((acc, part) => {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function formatIsoDate(parts) {
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatIsoDateTime(parts) {
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:00`;
}

function getUzbekistanDate(daysFromToday = 0, baseDate = new Date()) {
  const todayParts = getDatePartsInTimeZone(baseDate, UZBEKISTAN_TIME_ZONE);
  const shiftedDate = new Date(
    Date.UTC(
      Number(todayParts.year),
      Number(todayParts.month) - 1,
      Number(todayParts.day) + daysFromToday,
      12,
      0,
      0
    )
  );

  return formatIsoDate(getDatePartsInTimeZone(shiftedDate, UZBEKISTAN_TIME_ZONE));
}

function getUzbekistanDateTime(baseDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: UZBEKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(baseDate);

  const dateTimeParts = parts.reduce((acc, part) => {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day" ||
      part.type === "hour" ||
      part.type === "minute" ||
      part.type === "second"
    ) {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return formatIsoDateTime(dateTimeParts);
}

module.exports = {
  UZBEKISTAN_TIME_ZONE,
  getUzbekistanDate,
  getUzbekistanDateTime,
};
