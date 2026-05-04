/* eslint-disable */

import { ComponentConstructor } from 'quasar'

declare module 'vue' {
  export interface ComponentCustomProperties {
    $q: import('quasar').QVueGlobals
  }
}
