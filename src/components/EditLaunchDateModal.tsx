import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Loader from "./Loader";
import { useForm } from "react-hook-form";

interface EditLaunchDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  projectName: string;
  onUpdate: (newDate: string) => Promise<void>;
}
export type FormValues = {
  newDate: string;
};

const EditLaunchDateModal = ({
  isOpen,
  onClose,
  currentDate,
  projectName,
  onUpdate,
}: EditLaunchDateModalProps) => {
  const [newDate, setNewDate] = useState(currentDate.split(" ")[0]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      newDate: currentDate.split(" ")[0],
    },
  });
  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    await onUpdate(new Date(data.newDate).toISOString());
    setLoading(false);
    onClose();
  };
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minTime = now.toISOString().slice(0, 16);
    return minTime;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-[#14151E] rounded-[10px] border border-white p-6 w-[90%] max-w-md"
      >
        <div className="flex justify-center items-center mb-6">
          <h3 className="text-2xl font-bold text-[#CD9C03] font-inter">
            Edit Launch Date
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-2 font-lexend">
              Current Date:{" "}
              <span className="font-mono text-[#C2C2C4]/90 text-sm font-bold ml-1">
                {currentDate}
              </span>
            </label>
            <input
              type="datetime-local"
              min={getMinDateTime()}
              {...register("newDate", {
                required: "new date is required",
                validate: (value) => {
                  if (value && new Date(value) < new Date(getMinDateTime())) {
                    return "Date/time must be in the future.";
                  }
                  return true;
                },
              })}
              className="w-full bg-[#94A3B8]/5 text-[#94A3B8] rounded-lg p-3 focus:outline-none focus:ring-0 font-chakra"
            />
          </div>

          <div className="flex justify-center w-full  mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 font-normal leading-6 font-righteous rounded-[10px] bg-[#192634] text-white/90 hover:bg-opacioty-90 disabled:opacity-50 w-full text-xl"
            >
              {loading ? <Loader /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLaunchDateModal;
