import { useEffect, useState } from "react";

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

export default function ElevatorSystem() {
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [currentElevators, setCurrentElevators] = useState<Elevator[]>([]);
  const [activeButtons, setActiveButtons] = useState<ActiveButtons>({});
  const [error, setError] = useState<string | null>(null);

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

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_URL_API}`);

    socket.onopen = () => {
      console.log("WebSocket connected.");
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "STATUS_UPDATE" && data.data) {
          setCurrentElevators(data.data);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection error.");
    };
    socket.onclose = () => {
      console.log("WebSocket disconnected.");
      setWsConnected(false);
    };
    return () => {
      socket.close();
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

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Elevator Simulator</h1>
      <p>
        WebSocket:{" "}
        <span className={wsConnected ? "text-green-600" : "text-red-600"}>
          {wsConnected ? "Connected" : "Disconnected"}
        </span>
      </p>
      <div className="flex gap-6 mt-4">
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
