export const fieldId = (path: string) => `field-${path.replace(/\./g, "-")}`;
export const errorId = (path: string) => `${fieldId(path)}-error`;
