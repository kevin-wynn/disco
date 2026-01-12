export const sanitizeArtistName = (name: string) => {
  return name.replace(/[()0-9]/g, "");
};
