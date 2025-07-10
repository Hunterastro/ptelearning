declare module 'styled-components' {
  import { CSSObject, CSSProp } from 'styled-components';
  import React from 'react';

  export interface DefaultTheme {}

  export interface StyledComponent<
    C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
    T extends object,
    O extends object = {},
    A extends keyof any = never
  > extends React.ForwardRefExoticComponent<any> {}

  interface StyledInterface {
    <C extends keyof JSX.IntrinsicElements>(component: C): any;
    <C extends React.ComponentType<any>>(component: C): any;
    [key: string]: any;
  }

  declare const styled: StyledInterface & {
    div: any;
    span: any;
    p: any;
    h1: any;
    h2: any;
    h3: any;
    button: any;
    input: any;
    form: any;
    section: any;
    header: any;
    footer: any;
    nav: any;
    article: any;
    aside: any;
    main: any;
    [key: string]: any;
  };

  export default styled;
  export const css: any;
  export const keyframes: any;
  export const createGlobalStyle: any;
  export const ThemeProvider: any;
} 