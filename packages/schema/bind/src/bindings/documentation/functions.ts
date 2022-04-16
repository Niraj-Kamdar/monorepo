import { MustacheFn } from "../types";

export const typeFormatFilter: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    if (rendered.startsWith("[")) {
      return rendered.substring(1, rendered.length - 1) + "[]";
    }
    return rendered;
  };
};

export const hashtagPrefix: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    if (rendered === "") {
      return "";
    }
    return "# " + rendered;
  };
};

export const markdownItalics: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    if (rendered === "") {
      return "";
    }
    return "_" + rendered + "_";
  };
};

export const toTitle: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    const tokens: string[] = rendered.split("_");
    for (let i = 0; i < tokens.length; i++) {
      tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].substring(1);
    }
    return tokens.join(" ");
  };
};

export const toLower: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    return rendered.toLowerCase();
  };
};

export const moduleToLower: MustacheFn = () => {
  return (text: string, render: (template: string) => string): string => {
    const rendered: string = render(text);
    return rendered.replace("Query", "query").replace("Mutation", "mutation");
  };
};
