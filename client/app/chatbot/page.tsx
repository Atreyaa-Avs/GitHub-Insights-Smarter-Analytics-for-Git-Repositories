import React from "react";
import MainChatbotComponent from "./components/MainChatbotComponent";
import NavBar from "./NavBar";

const page = () => {
  return (
    <div className="h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex overflow-y-auto">
        <MainChatbotComponent />
      </div>
    </div>
  );
};

export default page;
