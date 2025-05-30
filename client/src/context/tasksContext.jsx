import { createContext, useContext, useState, useEffect } from "react";
import {
  createTaskRequest,
  deleteTaskRequest,
  getTasksRequest,
  getTaskRequest,
  updateTaskRequest,
  getOthersTasksRequest,
  togglePromotionRequest,
  getPromotedTasksRequest 
} from "../api/tasks";

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within a TaskProvider");
  return context;
};

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [othersTasks, setOthersTasks] = useState([]);
  const [promotedTasks, setPromotedTasks] = useState([]);

  useEffect(() => {
    getTasks();
    getOthersTasks();
    getPromotedTasks();
  }, []);

  const getPromotedTasks = async () => {
    try {
      const res = await getPromotedTasksRequest();
      setPromotedTasks(res.data);
    } catch (error) {
      console.error("Error al obtener promocionadas:", error);
    }
  };

  const togglePromotion = async (id, data) => {
    try {
      const res = await togglePromotionRequest(id, data);
      
      // Actualizar lista principal
      setTasks(prev => prev.map(task => 
        task._id === id ? { ...task, ...res.data } : task
      ));
      
      // Actualizar lista promocionada
      setPromotedTasks(prev => {
        const exists = prev.some(t => t._id === id);
        if (res.data.isPromoted && !exists) return [...prev, res.data];
        if (!res.data.isPromoted) return prev.filter(t => t._id !== id);
        return prev.map(t => t._id === id ? res.data : t);
      });
      
      return res.data;
    } catch (error) {
      console.error("Error al actualizar promoción:", error);
      throw error;
    }
  };
  

const getOthersTasks = async () => {
  try {
    const res = await getOthersTasksRequest(); // Llama al API
  const currentDate = new Date();                                                    
    const filtered = res.data?.filter(task => new Date(task.date) >= currentDate) || [];     
    setOthersTasks(filtered);
  } catch (error) {
    console.error("Error al obtener tareas de otros usuarios:", error);
  }
};
useEffect(() => {
  getOthersTasks(); // Llamamos la función cuando se carga la app
}, []);

const getTasks = async () => {
  try {
    const res = await getTasksRequest();
    const tasksConPropiedad = res.data.map(task => ({
      ...task,
      isOwner: true, // Agregar propiedad a tareas propias
    }));
    setTasks(tasksConPropiedad);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
  }
};


  const deleteTask = async (id) => {
    try {
      const res = await deleteTaskRequest(id);
      if (res.status === 204) setTasks(tasks.filter((task) => task._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const createTask = async (task) => {
    try {
      const res = await createTaskRequest(task);
      // Agregar la nueva tarea al estado
      setTasks([...tasks, res.data]);
      return res.data; // Devolver la tarea creada
    } catch (error) {
      console.log(error);
      throw error; // Lanzar el error para manejarlo en el componente
    }
  };

  const getTask = async (id) => {
    try {
      const res = await getTaskRequest(id);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  };

  const updateTask = async (id, task) => {
    try {
      const res = await updateTaskRequest(id, task);
      // Actualizar la tarea en el estado
      setTasks(tasks.map(t => t._id === id ? res.data : t));
      return res.data; // Devolver la tarea actualizada
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  return (
    <TaskContext.Provider
      value={{
        tasks,
        othersTasks,
        promotedTasks,
        getTasks,
        deleteTask,
        createTask,
        getTask,
        updateTask,
        getOthersTasks,
        togglePromotion,
        getPromotedTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}