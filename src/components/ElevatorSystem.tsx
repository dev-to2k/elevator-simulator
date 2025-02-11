import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const floors: number[] = Array.from({ length: 10 }, (_, i) => 10 - i);

interface ActiveButtons {
  [key: string]: boolean;
}

interface Elevator {
  id: number;
  currentFloor: number;
  destinationFloor?: number;
  direction: number;
  doorOpen: boolean;
  targets: number[];
}

interface ElevatorResponse {
  elevators: Elevator[];
}

// Define WebSocket status types
type WebSocketStatus =
  | "LOADING"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export default function ElevatorSystem() {
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("LOADING");
  const [wsError, setWsError] = useState<string | null>(null);
  const [currentElevators, setCurrentElevators] = useState<Elevator[]>([]);
  const [activeButtons, setActiveButtons] = useState<ActiveButtons>({});

  const getStatusColor = () => {
    switch (wsStatus) {
      case "LOADING":
      case "CONNECTING":
        return "text-yellow-600";
      case "CONNECTED":
        return "text-green-600";
      case "DISCONNECTED":
      case "ERROR":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (wsStatus) {
      case "LOADING":
        return "Loading...";
      case "CONNECTING":
        return "Connecting...";
      case "CONNECTED":
        return "Connected";
      case "DISCONNECTED":
        return "Disconnected";
      case "ERROR":
        return `Error: ${wsError || "Unknown error"}`;
      default:
        return "Unknown Status";
    }
  };

  const callElevator = async (
    columnIndex: number,
    targetFloor: number,
    direction: number
  ): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL_API}/api/elevators/call`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            floor: targetFloor,
            direction,
          }),
        }
      );
      await response.json();

      const key = `${columnIndex}-${targetFloor}-${direction}`;
      setActiveButtons((prev) => ({ ...prev, [key]: true }));
    } catch (error) {
      console.error("Error calling elevator:", error);
    }
  };

  useEffect(() => {
    const fetchElevators = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_URL_API}/api/elevators/status`
        );
        const data: ElevatorResponse = await response.json();
        setCurrentElevators(data.elevators);
      } catch (error) {
        console.error("Error fetching elevators:", error);
      }
    };

    fetchElevators();
  }, []);

  useEffect(() => {
    setWsStatus("CONNECTING");

    const socketIo = io(`${process.env.NEXT_PUBLIC_URL_API}`);

    socketIo.on("connect", () => {
      console.log("Socket.IO connected.");
      setWsStatus("CONNECTED");
    });

    socketIo.on("STATUS_UPDATE", (data: Elevator[]) => {
      console.log("Received STATUS_UPDATE:", data);
      setCurrentElevators(data);
    });

    socketIo.on("disconnect", () => {
      console.log("Socket.IO disconnected.");
      setWsStatus("DISCONNECTED");
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socketIo.on("error", (err: any) => {
      console.error("Socket.IO error:", err);
      setWsStatus("ERROR");
      setWsError("Socket.IO connection error.");
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  useEffect(() => {
    Object.keys(activeButtons).forEach((key) => {
      const parts = key.split("-");
      const floor = parseInt(parts[1]);

      const elevatorReached = currentElevators.find(
        (elevator) => elevator.currentFloor === floor
      );
      if (elevatorReached) {
        setActiveButtons((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    });
  }, [currentElevators, activeButtons]);

  if (wsError) {
    return <div className="text-red-500">{wsError}</div>;
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Elevator Simulator</h1>
      <p className="mb-4">
        WebSocket: <span className={getStatusColor()}>{getStatusText()}</span>
      </p>
      <div className="flex gap-6 mt-4 mb-10">
        {currentElevators.map((_, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            {floors.map((floor: number) => (
              <div
                key={`${columnIndex}-${floor}`}
                className="flex items-center gap-2"
              >
                <div className="flex flex-col gap-1 items-center">
                  {floor !== 10 && (
                    <button
                      className={`px-2 py-1 text-xs border w-8 ${
                        activeButtons[`${columnIndex}-${floor}-1`]
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() => callElevator(columnIndex, floor, 1)}
                    >
                      ⬆
                    </button>
                  )}
                  {floor !== 1 && (
                    <button
                      className={`px-2 py-1 text-xs border w-8 ${
                        activeButtons[`${columnIndex}-${floor}--1`]
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() => callElevator(columnIndex, floor, -1)}
                    >
                      ⬇
                    </button>
                  )}
                </div>
                <div
                  className={`w-20 h-20 flex flex-col items-center justify-center rounded-md ${
                    currentElevators[columnIndex]?.currentFloor === floor
                      ? "border-2 border-red-500"
                      : "border border-black"
                  }`}
                >
                  <span>{floor}</span>
                  <span className="text-xs">
                    {currentElevators[columnIndex]?.currentFloor === floor &&
                    currentElevators[columnIndex]?.doorOpen
                      ? "Opened Door"
                      : "Closed Door"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
