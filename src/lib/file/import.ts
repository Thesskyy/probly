export const fileImport = async (): Promise<File | null> => {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        resolve(target.files[0]);
      } else {
        resolve(null);
      }
    };

    input.click();
  });
};
