import React, { useEffect } from "react";
import { useTasks } from "../../context/tasksContext";
import { TaskCard }  from "../tasks/TaskCard";

export function ListaActividades() {
  const { othersTasks, getOthersTasks } = useTasks();

  useEffect(() => {
    getOthersTasks(); //  Cargar tareas al montar
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-green-700">Lista de actividades</h1>
      <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {othersTasks.map(task => (
          <TaskCard key={task._id} task={task} showActions={false} />
        ))}
      </div>
    </div>
  );
}
