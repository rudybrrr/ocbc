export function Icon({
  name,
}: {
  name: "home" | "move" | "invest" | "ask" | "back" | "hear" | "person" | "alert" | "adjust";
}) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === "home" && (
        <>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.8V20h12V9.8" />
          <path d="M10 20v-5h4v5" />
        </>
      )}
      {name === "move" && (
        <>
          <path d="M4 12h14" />
          <path d="M13 6l6 6-6 6" />
        </>
      )}
      {name === "invest" && (
        <>
          <path d="M4 16l5-5 3 3 7-7" />
          <path d="M14 7h5v5" />
        </>
      )}
      {name === "ask" && (
        <>
          <path d="M6 16.5 4 20l4.2-1.4" />
          <path d="M7 16.5h9.2A3.8 3.8 0 0 0 20 12.7V8.8A3.8 3.8 0 0 0 16.2 5H7.8A3.8 3.8 0 0 0 4 8.8v3.9A3.8 3.8 0 0 0 7 16.5Z" />
        </>
      )}
      {name === "back" && (
        <>
          <path d="M15 5 8 12l7 7" />
          <path d="M9 12h11" />
        </>
      )}
      {name === "hear" && (
        <>
          <path d="M4 10h3l4-3v10l-4-3H4z" />
          <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M17.5 7.5a6.5 6.5 0 0 1 0 9" />
        </>
      )}
      {name === "person" && (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
        </>
      )}
      {name === "alert" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <path d="M12 16.5h.01" />
        </>
      )}
      {name === "adjust" && (
        <>
          <path d="M4 8h16" />
          <path d="M4 16h16" />
          <circle cx="9" cy="8" r="2" />
          <circle cx="15" cy="16" r="2" />
        </>
      )}
    </svg>
  );
}
