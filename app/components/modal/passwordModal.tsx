import { useState } from "react";
import { Loader, LoaderSize } from "../ui/Loader";
import { EyeIcon, EyeSlashIcon } from "../ui/icons";

interface PasswordModaleProps {
  handleAction: (value: string) => void;
  onClose?: () => void;
  error?: string | null;
  loading: boolean;
}
enum typePass {
  password = 'password',
  text = 'text'
}

export default function PasswordModale({
  handleAction,
  error,
  loading,
}: PasswordModaleProps) {
  const [value, setValue] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="flex items-center justify-center z-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg text-white">
        <h1 className="text-2xl font-bold text-center">
          Необходимо ввести пароль
        </h1>
        <p className="text-center">
          Для дальнейшей работы с сообщениями необходимо ввести пароль. Это
          нужно для шифрования и расшифровки сообщений, чтобы злоумышлиники не
          могли их прочитать.
        </p>
        <div className="flex justify-center space-x-4 w-full">
          <form
            className="w-full relative"
            onSubmit={(e) => {
              e.preventDefault();
              handleAction(value);
            }}
          >
            <input
              type={isPasswordVisible ? typePass.text : typePass.password}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              onChange={(e) => setValue(e.target.value)}
              value={value}
            />
            <button
        type="button"
        className="absolute right-3 top-3 text-gray-300 hover:text-gray-800 focus:outline-none cursor-pointer"
        onClick={togglePasswordVisibility}
        aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
      >        
        {isPasswordVisible ? <EyeSlashIcon width={25} height={25}/> : <EyeIcon width={25} height={25}/>}
      </button>
            {error ? (
              <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
            ) : (
              <p className="p-3.5"> </p>
            )}
            <button
              type="submit"
              className={`px-4 w-full py-2 mt-4 bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? "cursor-none" : "cursor-pointer"}`}
              disabled={loading}
            >
              {loading ? (
                <Loader size={LoaderSize.xl} />
              ) : (
                <span className="p-1 flex justify-center items-center">
                  Отправить
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
