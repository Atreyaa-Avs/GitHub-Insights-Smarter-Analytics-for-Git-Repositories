"use client";

import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function ChatLayout() {
  return (
    <div className="h-screen w-full">
      <PanelGroup direction="horizontal">
        {/* Left panel */}
        <Panel defaultSize={50} className="h-full">
          <div className="h-full p-4 bg-gray-100">
            Code Editor
          </div>
        </Panel>

        {/* Resizer bar */}
        <PanelResizeHandle>
          <div className="w-1 bg-gray-400 hover:bg-gray-600 cursor-col-resize h-full" />
        </PanelResizeHandle>

        {/* Right panel */}
        <Panel className="h-full">
          <div className="h-full p-4 bg-gray-200">
            Output / Console
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}