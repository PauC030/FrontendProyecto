import { useEffect, useState } from "react";
import { useTasks } from "../../context/tasksContext";
import { useAsistencia } from "../../context/asistenciaContext";
import deleteImage from '../../assets/eliminarr.png';
import editImage from '../../assets/Editar.png';
import { ButtonIcon } from "../ui/ButtonIcon";
import { ButtonLinkIcon } from "../ui/ButtonLinkIcon";
import { CardActivi } from "../ui/CardActivi";
import { Switch } from '@headlessui/react';
import toast from "react-hot-toast";
import { useAttendance } from "../../hooks/useAttendance"
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/Button";

export function TaskCard({ task, showPromoBadge = false, showAttendanceButton = false }) {
  const navigate = useNavigate();

  const { togglePromotion, deleteTask } = useTasks();
  const { confirmAttendance, cancelAttendance, fetchAttendees, attendees } = useAsistencia();

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendModal, setShowAttendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
 
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [name, setName] = useState(() => localStorage.getItem("userName") || "");

  const [isAttending, setIsAttending] = useAttendance(task._id);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAttendees(task._id);
  }, [task._id]);


useEffect(() => {
  const savedEmail = localStorage.getItem("userEmail")?.trim().toLowerCase();
  if (savedEmail) {
    const userAttendances = JSON.parse(
      localStorage.getItem(`userAttendances_${savedEmail}`) || '[]'
    );
    setIsAttending(userAttendances.includes(task._id));
  }
}, [task._id]);
 
            

  const handleDelete = () => {
    deleteTask(task._id);
    setShowModal(false);
  };

  const handleTogglePromotion = async () => {
    try {
      await togglePromotion(task._id, {
        isPromoted: !task.isPromoted,
        promotion: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error("Error al cambiar promoción:", error);
    }
  };



  const handleConfirmAttend = async () => {
  if (!name?.trim() || !email) {
    toast.error("Completa todos los campos");
    return;
  }
  setIsLoading(true);
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // 1. Actualizar estado local primero (optimistic update)
    setIsAttending(true);
    
    // 2. Confirmar en backend
    await confirmAttendance({
      taskId: task._id,
      email: normalizedEmail,
      name: name.trim()
    });

    // 3. Guardar en localStorage
    localStorage.setItem("userEmail", normalizedEmail);
    localStorage.setItem("userName", name.trim());
    
    // 4. Actualizar lista de asistencias del usuario
    const userAttendances = JSON.parse(
      localStorage.getItem(`userAttendances_${normalizedEmail}`) || '[]'
    );
    if (!userAttendances.includes(task._id)) {
      localStorage.setItem(
        `userAttendances_${normalizedEmail}`,
        JSON.stringify([...userAttendances, task._id])
      );
    }
    setShowAttendModal(false);
    toast.success("Asistencia confirmada correctamente!");
  } catch (error) {
    setIsAttending(false); // Revertir si hay error
    toast.error(error.response?.data?.message || "Error al confirmar asistencia");
  } finally {
    setIsLoading(false);
  }
};

   const handleCancel = async () => {
  setIsLoading(true);
  try {
    const userEmail = email.trim().toLowerCase();
    
    // 1. Actualización optimista
    setIsAttending(false);
    
    // 2. Cancelar en el backend
    await cancelAttendance({ 
      taskId: task._id, 
      email: userEmail 
    });
    
    // 3. Actualizar localStorage
    const userAttendances = JSON.parse(
      localStorage.getItem(`userAttendances_${userEmail}`) || '[]'
    );
    const updatedAttendances = userAttendances.filter(id => id !== task._id);
    localStorage.setItem(
      `userAttendances_${userEmail}`,
      JSON.stringify(updatedAttendances)
    );
    // 4. Forzar recarga de asistentes
    await fetchAttendees(task._id);
    setShowCancelModal(false);
    toast.success("Asistencia cancelada correctamente ❌");
  } catch (err) {
    console.error("Error al cancelar asistencia:", err);
    setIsAttending(true); // Revertir en caso de error
    toast.error(err.response?.data?.message || "Error al cancelar asistencia");
  } finally {
    setIsLoading(false);
  }
};
       

  return (
    <>
      <CardActivi className="relative">
        {showPromoBadge && (
          <div className="absolute -top-1 -right-[1px] bg-[#EAB308] text-white px-3 py-1 text-xs font-semibold shadow z-20 flex items-center gap-1 rounded-bl-xl border-2 border-[#EAB308]/80">
            <span className="text-[0.75rem] tracking-wide">Promocionada</span>
            <span className="text-[0.65rem]">⭐</span>
          </div>
        )}

        <header className="relative">
          <div className="flex justify-between items-start gap-2">
            <h1 className="text-lg font-semibold break-words overflow-hidden text-ellipsis whitespace-nowrap flex-1">
              {task.title}
            </h1>

            {task.isOwner && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={task.isPromoted}
                  onChange={handleTogglePromotion}
                  className={`${
                    task.isPromoted ? 'bg-green-500' : 'bg-gray-300'
                  } relative inline-flex h-4 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      task.isPromoted ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {task.isPromoted ? 'Promocionada' : 'Promocionar'}
                </span>
              </div>
            )}
          </div>

          <div className="border-b border-[#c7c0c0] mt-2 mb-4 w-full" />

          {task.place && (
            <p className="text-gray-500 truncate">
              <span className="font-semibold">Lugar:</span> {task.place}
            </p>
          )}

          {task.responsible?.length > 0 && (
            <p className="text-gray-500 truncate">
              <span className="font-semibold">Responsable:</span> {task.responsible.join(", ")}
            </p>
          )}

          {task.date && (
            <p className="text-gray-500">
              <span className="font-semibold">Fecha:</span>{" "}
              {new Date(task.date).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>


       <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 w-full">
      <Button
    onClick={() => setShowDetailsModal(true)}
    className="w-full sm:w-auto px-4 sm:px-4 py-1 bg-[#22C55E] text-white rounded hover:bg-green-600 transition-colors text-sm sm:text-base whitespace-nowrap"
  >
    Ver Detalles
  </Button>

  {showAttendanceButton && (
    !isAttending ? (
      <button
        onClick={() => setShowAttendModal(true)}
        className="w-full sm:w-auto px-3 sm:px-4 py-1 border border-green-500 text-green-700 rounded hover:bg-green-100 transition-colors text-sm sm:text-base whitespace-nowrap"
      >
        Asistir a actividad
      </button>
    ) : (
      <button
        onClick={() => setShowCancelModal(true)} // px-4 py-1 rounded border border-red-600 text-red-600 font-semibold hover:bg-red-100 transition"
        className="w-full sm:w-auto px-3 sm:px-4  py-1 rounded border border-red-600 text-red-600 font-semibold hover:bg-red-100 transition text-sm sm:text-base whitespace-nowrap"
      >
        Cancelar Asistencia
      </button>
    )
  )}

       
          {task.isOwner && (
    <div className="flex gap-x-1 items-center ml-4">
      {/* Botón de Asistencia */}
      <button
        onClick={() => navigate(`/tasks/asistencia?taskId=${task._id}`)}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline mr-2"
      > Asistencia
      </button>
      
      {/* Botones existentes de editar/eliminar */}
      <ButtonIcon onClick={() => setShowModal(true)}>
        <img src={deleteImage} alt="Eliminar" className="h-6 w-6 hover:scale-110" />
      </ButtonIcon>
      <ButtonLinkIcon to={`/tasks/${task._id}`}>
        <img src={editImage} alt="Editar" className="h-6 w-6 hover:scale-110" />
      </ButtonLinkIcon>
    </div>
         
          )}
        </div>
      </CardActivi>


      {/* Modal de Detalles */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
            <h2 className="text-3xl font-bold mb-4 text-center text-gray-800 break-words whitespace-normal">
              {task.title}
            </h2>

            <div className="space-y-4">
              <p className="text-gray-600">
                <span className="font-semibold">Descripción:</span> {task.description}
              </p>
              {task.place && (
                <p className="text-gray-600">
                  <span className="font-semibold">Lugar:</span> {task.place}
                </p>
              )}
              {task.responsible?.length > 0 && (
                <p className="text-gray-600">
                  <span className="font-semibold">Responsables:</span> {task.responsible.join(", ")}
                </p>
              )}
              {task.date && (
                <p className="text-gray-600">
                  <span className="font-semibold">Fecha:</span>{" "}
                  {new Date(task.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-start">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-white font-medium rounded bg-gradient-to-r from-[#064349] to-[#03683E] hover:opacity-90"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Asistencia */}
      {showAttendModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-[90%] max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Confirmar asistencia</h2>
            <p className="text-gray-600">Completa tus datos para asistir a esta actividad.</p>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nombre"
                className="p-2 border rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="p-2 border rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowAttendModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                onClick={handleConfirmAttend}
                disabled={isLoading}
              >
                {isLoading ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar Asistencia */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-[90%] max-w-md space-y-4">
            <h2 className="text-xl font-semibold">¿Cancelar asistencia?</h2>
            <p className="text-gray-600">¿Estás seguro de que deseas cancelar tu asistencia a esta actividad?</p>

            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowCancelModal(false)}
                disabled={isLoading}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Actividad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
              ¿Estás seguro que deseas eliminar esta actividad?
            </h2>

            <p className="mb-6 text-gray-600 text-center">
              Esta acción eliminará todos los archivos asociados permanentemente.
            </p>

            <div className="border-t border-gray-200 my-4" />

            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 text-gray-700 font-semibold rounded border border-gray-400 hover:bg-gray-100 transition"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 text-white font-semibold rounded bg-gradient-to-r from-[#ef4444] to-[#b91c1c] hover:opacity-90"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}