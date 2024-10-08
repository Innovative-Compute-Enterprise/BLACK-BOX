const NoMessages = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex gap-4 p-4 ">
        {/* Square Shape */}
        <div className="flex flex-col items-center p-4 rounded-md">
            <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
              <rect width="120" height="120" fill="white" />
            </svg>
        </div>
        
        {/* Triangle Shape */}
        <div className="flex flex-col items-center p-4 rounded-md">
            <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
              <polygon points="60,0 120,120 0,120" fill="white" />
            </svg>
        </div>
        
        {/* Circle Shape */}
        <div className="flex flex-col items-center p-4 rounded-md">
            <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="60" fill="white" />
            </svg>
          </div>
        </div>
    </div>
  );
};

export default NoMessages;