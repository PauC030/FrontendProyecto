export function CardActivi({ children, className = "" }) {
  return (
    <div
      className={`
        w-[95%] sm:w-[90%] md:w-[90%] lg:w-[85%] xl:w-[80%]
        ml-[60px]          // margen izquierdo mayor
        mr-[6px]          // margen derecho menor
        px-4
        bg-white
        shadow-md
        p-4
        rounded-lg
        border-2
        border-[#EAB308]
        hover:border-amber-300
        hover:bg-amber-50
        hover:shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        min-w-[280px]
        ${className}
      `}
    >
      {children}
    </div>
  );}