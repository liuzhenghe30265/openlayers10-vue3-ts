export interface LayerData {
    id?: string
    name: string
}

export interface LayerParams {
    pageNo: number
    pageSize: number
    isAsc: boolean
    sortBy: string
}

export interface MarkerData {
    id?: string
    layerId?: string
    name?: string
    level?: number
    geoJson?: string
    geometryType?: number
}

export interface MarkerParams {
    id: string
    layerId: string
}