# PurePrint

Base on [PrintThis](https://github.com/jasonday/printThis), but not depend on `jQuery`

## usage

```javascript
  import PrintThis from 'pure-print'
  const printThisDefaults = {
    debug: false, // show the iframe for debugging
    importCSS: true, // import parent page css
    importStyle: true, // import style tags
    printContainer: true, // print outer container/$.selector
    loadCSS: '', // load an additional css file - load multiple stylesheets with an array []
    pageTitle: '', // add title to print page
    removeInline: false, // remove all inline styles
    printDelay: 333, // variable print delay
    header: null, // prefix to html
    footer: null, // postfix to html
    formValues: true, // preserve input/form values
    canvas: false, // copy canvas content (experimental)
    base: false, // preserve the BASE tag, or accept a string for the URL
    doctypeString: '<!DOCTYPE html>', // html doctype
    removeScripts: false, // remove script tags before appending
    copyTagClasses: false // copy classes from the html & body tag
  }
  PrintThis('#id', printThisDefaults)
```


## types

```typescript
export declare type PrintThisProp = {
    debug?: boolean;
    importCSS?: boolean;
    importStyle?: boolean;
    printContainer?: boolean;
    loadCSS?: string | string[];
    pageTitle?: string;
    removeInline?: boolean;
    printDelay?: number;
    header?: string;
    footer?: string;
    formValues?: boolean;
    canvas?: boolean;
    base?: boolean;
    doctypeString?: string;
    removeScripts?: boolean;
    copyTagClasses?: boolean | 'b' | 'h' | 'bh';
};
export default function printThis(element: HTMLElement | string, options?: PrintThisProp): void;

```
