const Report = ({ ...props }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2} // Corrected property name
        strokeLinecap="round" // Corrected property name
        strokeLinejoin="round" // Corrected property name
        className="icon icon-tabler icons-tabler-outline icon-tabler-message-report"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
        <path d="M12 8v3" />
        <path d="M12 14v.01" />
      </svg>
    );
  };
  
  export default Report;