import { $, $$, render, store, useEffect, useMemo, type JSX, isObservable, ObservableMaybe, type Observable, ObservableReadonly } from 'woby'
import 'woby-wheeler/dist/output.css'
import { ToObservable } from './util'


export const useShow = <T,>() => {
    const show = store({}) as ToObservable<T, boolean>

    return show
}