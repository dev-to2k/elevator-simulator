import { useEffect, useState } from "react";

const floors: number[] = Array.from({ length: 10 }, (_, i) => 10 - i);

interface ActiveButtons {
  [key: string]: { [key: string]: boolean };
}

interface Elevator {
  id: number;
  currentFloor: number;
  destinationFloor: number;
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

  const fetchElevators = async (): Promise<void> => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/elevators/status"
      );
      const data: ElevatorResponse = await response.json();
      setCurrentElevators(data.elevators);
    } catch (error) {
      console.error("Error fetching elevators:", error);
    }
  };

  console.log(currentElevators);

  const callElevator = async (
    columnIndex: number,
    targetFloor: number,
    direction: number
  ): Promise<void> => {
    console.log({ columnIndex, targetFloor, direction });

    try {
      const response = await fetch("http://localhost:5000/api/elevators/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          floor: targetFloor,
          direction,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      setActiveButtons((prev) => ({
        ...prev,
        [columnIndex]: {
          ...prev[columnIndex],
          [`${targetFloor}-${direction}`]: true,
        },
      }));

      setTimeout(() => {
        setActiveButtons((prev) => ({
          ...prev,
          [columnIndex]: {
            ...prev[columnIndex],
            [`${targetFloor}-${direction}`]: false,
          },
        }));
      }, 3000);
    } catch (error) {
      console.error("Error calling elevator:", error);
    }
  };

  const toggleDoor = (
    columnIndex: number,
    targetFloor: number,
    isOpen: boolean
  ): void => {
    setCurrentElevators((prev) =>
      prev.map((elevator, idx) => {
        if (idx === columnIndex && elevator.currentFloor === targetFloor) {
          return { ...elevator, doorOpen: isOpen };
        }
        return elevator;
      })
    );
  };

  useEffect(() => {
    fetchElevators();

    // const intervalId = setInterval(() => {
    //   fetchElevators();
    // }, 3000);

    // return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const socket = new WebSocket("http://localhost:5000");

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

  if (!wsConnected) {
    return <div className="text-red-500">Connecting to WebSocket...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex gap-6 justify-center mt-10">
      {currentElevators.map((elevator, columnIndex) => (
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
                      activeButtons[columnIndex]?.[`${floor}-1`]
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
                      activeButtons[columnIndex]?.[`${floor}--1`]
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
                  elevator.currentFloor === floor
                    ? "border-2 border-red-500"
                    : "border border-black"
                }`}
              >
                <span>{floor}</span>
                <span className="text-xs">
                  {elevator.currentFloor === floor
                    ? elevator.doorOpen
                      ? "Opened Door"
                      : "Closed Door"
                    : "Closed Door"}
                </span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <button
                  className={`px-2 py-1 text-xs border w-8 ${
                    elevator.currentFloor === floor && elevator.doorOpen
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() =>
                    elevator.currentFloor === floor &&
                    toggleDoor(columnIndex, floor, true)
                  }
                >
                  ⇦⇨
                </button>
                <button
                  className={`px-2 py-1 text-xs border w-8 ${
                    elevator.currentFloor === floor && !elevator.doorOpen
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() =>
                    elevator.currentFloor === floor &&
                    toggleDoor(columnIndex, floor, false)
                  }
                >
                  ⇨⇦
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
