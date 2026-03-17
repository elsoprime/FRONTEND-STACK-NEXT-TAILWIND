export function formatSpanishLongDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "fecha no disponible";
  }

  const formatted = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(parsedDate)
    .replace(",", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
