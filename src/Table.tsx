import React, { $, $$, render, useEffect, useMemo, ObservableMaybe, Observable, ObservableReadonly, type JSX, } from 'woby'
import { tw } from 'woby-styled'

import '../dist/output.css'
import { Slider } from "woby-slider"
import 'woby-slider/dist/output.css'
import { $$$, ObservantAll } from "use-woby"
import { useData } from './useData'



export type GroupedLike<T> = {
    [x: string]: T | GroupedLike<T>
} | T

export type TableProps<T extends T[]> = Omit<JSX.TableHTMLAttributes<HTMLTableElement>, 'data' | 'group'> & {
    data: ObservableMaybe<string>, //ObservableMaybe<GroupedLike<T>>,
    collapsed?: ObservableMaybe<boolean>,
    orderColumns?: string[],
    Th?: (props: JSX.ThHTMLAttributes<HTMLTableCellElement> & { col: string, index: number, columns: string[], group: string[], sortable?: Observable<boolean>, sortDireotion?: Observable<'asc' | 'dsc' | 'none'> }) => HTMLTableCellElement
    Td?: (props: JSX.TdHTMLAttributes<HTMLTableCellElement> & { col: string, value: any, index: number, row: T }) => HTMLTableCellElement
    Tr?: (props: JSX.HTMLAttributes<HTMLTableRowElement>) => HTMLTableRowElement
    /** tr for nested table*/
    Nr?: (props: JSX.HTMLAttributes<HTMLTableRowElement>) => HTMLTableRowElement
    /** tr for group*/
    Gt?: (props: TableProps<T> & { group: string[] }) => JSX.Child //typeof Table<T>
    /** Td fro group */
    Gr?: (props: JSX.HTMLAttributes<HTMLTableRowElement>) => HTMLTableRowElement
    /** Group subtable with */
    Gd?: (props: JSX.HTMLAttributes<HTMLTableRowElement> & { data: T[], group: string, index: number, groups: string[], collapse: Observable<boolean> }) => HTMLTableRowElement
    /** group group */
    group?: string[],
    /** group = group group */
    preprocessor?: (data: GroupedLike<T>, group?: string[]) => GroupedLike<T>,
    pageSize?: ObservableMaybe<number>,
    hideScrollbar?: ObservableMaybe<boolean>,
    noWheel?: ObservableMaybe<boolean>,
} & ReturnType<typeof useData<T>>

const sortByOrder = <T,>(sourceArray: T[], orderArray: T[]): T[] => {
    const orderMap = new Map()

    // Create a map to store the index of each element in the orderArray
    orderArray.forEach((element, index) => {
        orderMap.set(element, index)
    })

    // Sort the sourceArray based on the index in the orderArray
    return sourceArray.sort((a, b) => {
        const indexA = orderMap.get(a)
        const indexB = orderMap.get(b)

        if (indexA !== undefined && indexB !== undefined) {
            return indexA - indexB
        }

        // If elements are not found in the orderArray, keep their original order
        return 0
    })
}


const renderData = <T extends T[],>(props: Omit<TableProps<T>, 'data'> & { data: ObservableMaybe<string[]> }) => {
    const { data, Th, Td, Tr, Gr, Nr, Gt, Gd, group, orderColumns, pageSize = $(10), hideScrollbar = $(false), noWheel = $(false), className, class: cls, ...rp } = props
    const startIndex = $(0)
    const ROW_HEIGHT = $(10)
    const row1 = $<HTMLTableRowElement>()
    const hr = $<HTMLTableRowElement>()
    const smallScroll = 3
    const largeScroll = 10
    const tableRef = $<HTMLTableElement>()

    useEffect(() => { $$(row1) && ROW_HEIGHT($$(row1).clientHeight) })

    let startY = 0 // Store the initial Y position

    const handlePointerDown = (e: JSX.TargetedMouseEvent<HTMLTableElement> | JSX.TargetedTouchEvent<HTMLTableElement>) => {
        // Record the initial Y position on mouse/touch down
        startY = (e as JSX.TargetedMouseEvent<HTMLTableElement>).clientY || (e as JSX.TargetedTouchEvent<HTMLTableElement>).touches[0].clientY
    }

    const handlePointerUp = (e: JSX.TargetedMouseEvent<HTMLTableElement> | JSX.TargetedTouchEvent<HTMLTableElement>) => {
        // Calculate the difference between the initial and final Y position
        const endY = (e as JSX.TargetedMouseEvent<HTMLTableElement>).clientY || (e as JSX.TargetedTouchEvent<HTMLTableElement>).changedTouches[0].clientY
        const deltaY = endY - startY

        // console.log('Scroll delta:', deltaY)

        // Use deltaY to determine the scroll direction and apply your logic
        if (deltaY > 0) {
            //@ts-ignore
            wheel({ deltaY })
            // Scroll down
            // console.log('Scroll down')
            // Implement your logic for scrolling down
        } else if (deltaY < 0) {
            //@ts-ignore
            wheel({ deltaY })
            // Scroll up
            // console.log('Scroll up')
            // Implement your logic for scrolling up
        }
    }

    const endIndex = useMemo(() => (Math.min($$(data).length, $$(startIndex) + $$(pageSize))))

    const wheel = (e: JSX.TargetedWheelEvent<HTMLDivElement>) => {
        // console.log('scroll', e)

        if (e.deltaY > 0)
            if (e.deltaY === 100)
                startIndex(Math.min($$(startIndex) + 1, $$(data).length - $$(pageSize)))
            else if (e.deltaY === 200)
                startIndex(Math.min($$(startIndex) + smallScroll, $$(data).length - $$(pageSize)))
            else
                startIndex(Math.min($$(startIndex) + largeScroll, $$(data).length - $$(pageSize)))
        else if (e.deltaY < 0)
            if (e.deltaY === -100)
                startIndex(Math.max($$(startIndex) - 1, 0))
            else if (e.deltaY === -200)
                startIndex(Math.max($$(startIndex) - smallScroll, 0))
            else
                startIndex(Math.min($$(startIndex) + largeScroll, $$(data).length - $$(pageSize)))
    }

    const nd = useMemo(() => $$(data).slice($$(startIndex), $$(endIndex)))

    const sortedKeys = useMemo(() => sortByOrder(Object.keys($$(data)[0]), $$(orderColumns) ?? []))
    return <div>
        <table {...rp} onWheel={e => props.onWheel ?? ($$(noWheel) ? undefined : wheel(e))} onPointerMove={e => $$(noWheel) ? undefined : wheel(e as any)} ref={tableRef} class={[cls, className, () => !$$(hideScrollbar) ? 'inline-block' : '']}>
            <thead>
                <tr ref={hr}>
                    {() => $$(sortedKeys).map((col, index, columns) => Th({ col, index, columns, group }))}
                </tr>
            </thead>
            <tbody>
                {() => $$(nd).map((row, index) => (
                    <Tr>
                        {() => $$(sortedKeys).map((col) => (
                            //@ts-ignore
                            <Td ref={index === 0 ? row1 : undefined} {...{ value: row[col], col, index, row }} />
                        ))}
                    </Tr>
                ))}
            </tbody>
        </table>
        {
            () => !$$(hideScrollbar) && $$(data).length > $$(pageSize) ?
                <Slider
                    class="w-[4px] inline-block m-0
                [&>.rangesliderFill]:bg-[#e6e6e6]
                active:[&>.rangesliderHandle]:w-[30px] 
                active:[&>.rangesliderHandle]:h-[30px] 
                active:[&>.rangesliderHandle]:left-[-13px] 
                hover:[&>.rangesliderHandle]:w-[30px] 
                hover:[&>.rangesliderHandle]:h-[30px] 
                hover:[&>.rangesliderHandle]:left-[-13px] 
                [&>.rangesliderHandle]:w-[20px] 
                [&>.rangesliderHandle]:h-[20px] 
                [&>.rangesliderHandle]:left-[-9px] 
                [&>.rangesliderHandle]:bg-white 
                [&>.rangesliderHandle]:shadow-[0_1px_1px_#333]
                [&>.rangesliderHandle]:rounded-[50%]
                [&_.rangesliderHandle-tooltip]:opacity-40
                "
                    style={{ height: () => ($$(tableRef)?.offsetHeight - $$(hr)?.clientHeight), /* top: () => $$(hr)?.clientHeight */ }}
                    min={0}
                    /** @ts-ignore */
                    max={() => $$(data).length - $$(pageSize)}
                    value={startIndex}
                    onChange={startIndex}
                    formatTooltip={v => $$(v) + $$(pageSize)}
                    orientation="vertical"
                    reverse
                //alwaysOnTooltip
                // onChange={value}
                // onChangeComplete={value}
                /> : null
        }
    </div>
}

export const Table = <T extends T[],>({ data: dt, collapsed, ...props }: TableProps<T>) => {
    const np: TableProps<T> = {
        Th: ({ columns }) => <th>{columns}</th>,
        Td: ({ col, row, }) => <td class='border-[1px] border-solid border-[lightgray]'>{row[col]}</td>,
        Tr: tw('tr')``,
        Nr: tw('tr')``,
        Gt: (props) => <Table {...props} />,
        Gr: tw('tr')`cursor-pointer`,
        Gd: ({ group, groups }) => <td class='border-[1px] border-solid border-[lightgray]' colSpan={groups.length}>{group}</td>,
        ...props
    } as any

    const { Nr, Gr, Gt, Gd, Td, Tr, Th, preprocessor, class: cls, className, ...rp } = np
    const data = useMemo(() => preprocessor ? preprocessor($$(dt) as any) : $$(dt))

    return (!$$(data) ? null : Array.isArray($$(data)) ?
        //@ts-ignore
        renderData({ ...np, data: data as Observable<T>, class: [cls, className], group: [props.group].flat().filter(n => !!n), }) :
        <table {...rp} class={[className, cls]}>
            <tbody>
                {Object.keys($$(data)).map((g, index, d) => {
                    const collapse = $($$(collapsed))
                    const ks = [props.group, g].flat().filter(n => !!n)
                    const gt = preprocessor ? preprocessor($$(data)[g], ks) : $$(data)[g]

                    return <>
                        <Gr onClick={() => collapse(!$$(collapse))}>
                            <Gd {...{ group: g, groups: d, index, collapse, data: gt }} />
                        </Gr>
                        {useMemo(() => {
                            [data, g, index]
                            return !$$(collapse) ? (
                                // Array.isArray(gt) ?
                                //     <Nr>
                                //         <td>{renderData({ ...np, group: ks, data: gt })}</td>
                                //     </Nr>
                                //     :
                                <Gt {...{ ...np, group: ks, data: gt, collapsed, }} />
                            ) : null
                        })}
                    </>
                })}
            </tbody>
        </table >
    )
}

