function createDom(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return Array.from(div.children)
}

function createElement(tag: string, prop: object, children?) {
  const element = document.createElement(tag)
  Object.keys(prop).forEach(key => {
    element[key] = prop[key]
  })
  if (children) {
    element.appendChild(children)
  }
  return element
}

const LinkElementBaseType = {
  type: 'text/css',
  rel: 'stylesheet'
}

function appendContent($el: HTMLElement, html: string) {
  if (!html) return
  const content = createDom(html)[0]
  $el.append(content)
}

function appendBody($body: HTMLBodyElement, element: HTMLElement, options) {
  // Clone for safety and convenience
  const $content = element.cloneNode(true) as  HTMLElement
  if (options.removeScripts) {
    $content
    $content.querySelectorAll('script').forEach(each => {
      each.remove()
    })
  }

  if (options.printContainer) {
    // grab $.selector as container
    const div = createElement('div', {}, $content)
    // div.append($content)
    $body.append(div)
  } else {
    // otherwise just print interior elements of container
    $body.append($content)
  }
}

// defaults

export type PrintThisProp = {
  debug?: boolean; // show the iframe for debugging
  importCSS?: boolean; // import parent page css
  importStyle?: boolean; // import style tags
  printContainer?: boolean; // print outer container/$.selector
  loadCSS?: string | string[]; // load an additional css file - load multiple stylesheets with an array []
  pageTitle?: string; // add title to print page
  removeInline?: boolean; // remove all inline styles
  printDelay?: number; // variable print delay
  header?: string; // prefix to html
  footer?: string; // postfix to html
  formValues?: boolean; // preserve input/form values
  canvas?: boolean; // copy canvas content (experimental)
  base?: boolean; // preserve the BASE tag, or accept a string for the URL
  doctypeString?: string; // html doctype
  removeScripts?: boolean; // remove script tags before appending
  copyTagClasses?: boolean | 'b' | 'h' | 'bh'; // copy classes from the html & body tag
}

const printThisDefaults: PrintThisProp = {
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

export default function printThis(element: HTMLElement|string, options?: PrintThisProp) {
  const opt = Object.assign({}, printThisDefaults, options)

  const iframeId = 'printThis-' + new Date().getTime()
  let printElement
  if(typeof element === 'string') {
    printElement = document.querySelector(element)
  } else {
    printElement = element
  }
  if(!printElement) {
    throw new Error('element is not exist')
  }
  let $iframe: HTMLFrameElement = createElement('iframe', {
    id: iframeId,
    name: 'printIframe'
  }) as HTMLFrameElement
  if (
    window.location.hostname !== document.domain &&
    navigator.userAgent.match(/msie/i)
  ) {
    // Ugly IE hacks due to IE not inheriting document.domain from parent
    // checks if document.domain is set by comparing the host name against document.domain
    const iframeSrc =
      'javascript:document.write("<head><script>document.domain=\\"' +
      document.domain +
      '\\";</s' +
      'cript></head><body></body>")'
    $iframe.className = 'MSIE'
    $iframe.src = iframeSrc
  }
  document.body.appendChild($iframe)
  // show frame if in debug mode
  if (!opt.debug) {
    const cssStyle = {
      position: 'absolute',
      width: '0px',
      height: '0px',
      left: '-600px',
      top: '-600px'
    }
    Object.keys(cssStyle).forEach(each => {
      $iframe.style[each] = cssStyle[each]
    })
  }
  // $iframe.ready() and $iframe.load were inconsistent between browsers
  setTimeout(() => {
    // Add doctype to fix the style difference between printing and render
    let iframeDoc = $iframe.contentDocument
    if (opt.doctypeString) {
      iframeDoc.open()
      // iframeDoc.write(opt.doctypeString)
      iframeDoc.close()
    }
    const $head = iframeDoc.head,
    $iframeBody = iframeDoc.body as HTMLBodyElement,
    $base = document.querySelector('base')
    let baseURL
    if (opt.base === true && $base) {
      // take the base tag from the original page
      baseURL = $base.getAttribute('href')
    } else if (typeof opt.base === 'string') {
      // An exact base string is provided
      baseURL = opt.base
    } else {
      // Use the page URL as the base
      baseURL = document.location.protocol + '//' + document.location.host
    }

    $head.append('<base href="' + baseURL + '">')
    // add base tag to ensure elements use the parent domain

    // import page stylesheets
    if (opt.importCSS) {
      document.querySelectorAll('link[rel=stylesheet]').forEach(function(each) {
        each
        const href = each.getAttribute('href')
        if (href) {
          const media = each.getAttribute('media') || 'all'
          const link = createElement('link', {
            ...LinkElementBaseType,
            href,
            media
          })
          $head.append(link)
        }
      })
    }

    // import style tags
    if (opt.importStyle) {
      document.querySelectorAll('style').forEach(function(each) {
        $head.appendChild(each.cloneNode(true))
      })
    }

    // add title of the page
    if (opt.pageTitle) {
      const title = createElement('title', {}, opt.pageTitle)
      $head.append(title)
    }

    // import additional stylesheet(s)
    if (opt.loadCSS) {
      let fragment = document.createDocumentFragment()
      if (Array.isArray(opt.loadCSS)) {
        opt.loadCSS.forEach(href => {
          fragment.append(
            createElement('link', {
              ...LinkElementBaseType,
              href
            })
          )
        })
      } else {
        fragment.append(
          createElement('link', {
            ...LinkElementBaseType,
            href: opt.loadCSS
          })
        )
      }
      $head.appendChild(fragment)
    }

    // copy 'root' tag classes
    let tag = opt.copyTagClasses
    if (tag) {
      tag = tag === true ? 'bh' : tag
      if (tag.indexOf('b') !== -1) {
        $iframeBody.classList.add(document.body.className)
      }
      if (tag.indexOf('h') !== -1) {
        iframeDoc.documentElement.classList.add(
          document.documentElement.className
        )
      }
    }

    // print header

    if (opt.header) {
      appendContent($iframeBody, opt.header)
    }
    appendBody($iframeBody, printElement, opt)
    if (opt.canvas) {
      // add canvas data-ids for easy access after cloning.
      let canvasId = 0
      printElement.querySelectorAll('canvas').forEach(function(each) {
        each.setAttribute('data-printthis', '' + canvasId++)
      })
      // Re-draw new canvases by referencing the originals
      $iframeBody.querySelectorAll('canvas').forEach(function(each) {
        let cid = each.getAttribute('data-printthis'),
          $src = document.querySelector(
            '[data-printthis="' + cid + '"]'
          ) as HTMLCanvasElement

        this.getContext('2d').drawImage($src, 0, 0)

        // Remove the markup from the original
        $src.removeAttribute('data-printthis')
      })
    }

    // capture form/field values
    if (opt.formValues) {
      // loop through inputs
      const $input = printElement.querySelectorAll('input')
      if ($input.length) {
        $input.forEach(function(each) {
          let $name = each.getAttribute('name'),
            isCheckbox = each.type === 'checkbox',
            isRadiobox = each.type === 'radio',
            $iframeInput: HTMLInputElement = iframeDoc.querySelector(
              `input[name="${$name}"]`
            ),
            $value = each.value
          // order matters here
          if (!(isRadiobox && isCheckbox)) {
            $iframeInput.value = $value
          } else if (each.checked) {
            if (isCheckbox) {
              $iframeInput.setAttribute('checked', 'checked')
            } else if (isRadiobox) {
              iframeDoc
                .querySelector(
                  'input[name="' + $name + '"][value="' + $value + '"]'
                )
                .setAttribute('checked', 'checked')
            }
          }
        })
      }

      // loop through selects
      const $select = printElement.querySelectorAll('select')
      if ($select.length) {
        $select.forEach(function(each) {
          let $name = each.getAttribute('name'),
            $value = each.value
          const dom = iframeDoc.querySelector(
            'select[name="' + $name + '"]'
          ) as HTMLSelectElement
          dom.value = $value
        })
      }

      // loop through textareas
      const $textarea = printElement.querySelectorAll('textarea')
      if ($textarea.length) {
        $textarea.forEach(function(each) {
          let $name = each.getAttribute('name'),
            $value = each.value
          const dom = iframeDoc.querySelector(
            'textarea[name="' + $name + '"]'
          ) as HTMLInputElement
          dom.value = $value
        })
      }
    } // end capture form/field values

    // remove inline styles
    if (opt.removeInline) {
      // $.removeAttr available jQuery 1.7+
      iframeDoc.querySelectorAll('body *').forEach(each => {
        each.removeAttribute('style')
      })
    }

    // print "footer"
    appendContent($iframeBody, opt.footer)

    setTimeout(() => {
      if ($iframe.classList.contains('MSIE')) {
        // check if the iframe was created with the ugly hack
        // and perform another ugly hack out of neccessity
        $iframe.focus()
        $head.append('<script>  window.print(); </s' + 'cript>')
      } else {
        // proper method
        if (document.queryCommandSupported('print')) {
          iframeDoc.execCommand('print', false, null)
        } else {
          $iframe.contentWindow.focus()
          $iframe.contentWindow.print()
        }
      }
      // remove iframe after print
      if (!opt.debug) {
        setTimeout(() => {
          $iframe.remove()
        }, 1000)
      }
    }, opt.printDelay)
  }, 333)
}
