import { useEffect, useState } from "react";

const useIs2xl = (): boolean => {
  const [is2xl, setIs2xl] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1537px)");

    const handleChange = () => {
      setIs2xl(mediaQuery.matches);
    };

    // Set initial value
    setIs2xl(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return is2xl;
};

export default useIs2xl;