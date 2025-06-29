import React from "react";
import { FaRegDotCircle } from "react-icons/fa";

// Define the type for the props
interface TitlebarProps {
  title?: string;
  bgColor?: string;
  className?: string;
}

// The Titlebar component accepts props for flexibility and reusability
const Titlebar: React.FC<TitlebarProps> = ({
  title = "Titlebar",
  className = "",
}) => {
  return (
    <div
      className={` ${className} capitalize flex items-center justify-between`}
    >
      <div
        className={`${className} items-center justify-center flex gap-3 font-unbounded text-xl font-semibold`}
      >
        {title}
      </div>
    </div>
  );
};

export default Titlebar;
