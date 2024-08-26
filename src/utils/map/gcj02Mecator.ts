/* eslint-disable no-loss-of-precision */
// 导入 proj 控件，使用其方法注入 gcj02 坐标系
import {
  Projection,
  addProjection,
  addCoordinateTransforms,
  getTransform
} from 'ol/proj'

const PI = Math.PI
const AXIS = 6378245.0
const OFFSET = 0.00669342162296594323 // (a^2 - b^2) / a^2

function delta(wgLon: number, wgLat: number) {
  let dLat = transformLat(wgLon - 105.0, wgLat - 35.0)
  let dLon = transformLon(wgLon - 105.0, wgLat - 35.0)
  const radLat = (wgLat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - OFFSET * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI)
  dLon = (dLon * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI)
  return [dLon, dLat]
}

function outOfChina(lon: number, lat: number) {
  if (lon < 72.004 || lon > 137.8347) {
    return true
  }
  if (lat < 0.8293 || lat > 55.8271) {
    return true
  }
  return false
}

function transformLat(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLon(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

const forEachPoint = function (func: { (input: any, output: any, offset: any): void; (input: any, output: any, offset: any): void; (arg0: any, arg1: any, arg2: number): void }) {
  return function (input: string | any[], opt_output: any, opt_dimension: number) {
    const len = input.length
    const dimension = opt_dimension || 2
    let output
    if (opt_output) {
      output = opt_output
    } else if (dimension !== 2) {
      output = input.slice()
    } else {
      output = new Array(len)
    }
    for (let offset = 0; offset < len; offset += dimension) {
      func(input, output, offset)
    }
    return output
  }
}

const gcj02 = {
  toWGS84: forEachPoint(function (input: { [x: string]: any }, output: { [x: string]: any }, offset: number) {
    let lng = input[offset]
    let lat = input[offset + 1]
    if (!outOfChina(lng, lat)) {
      const deltaD = delta(lng, lat)
      lng = lng - deltaD[0]
      lat = lat - deltaD[1]
    }
    output[offset] = lng
    output[offset + 1] = lat
  }),
  fromWGS84: forEachPoint(function (input: { [x: string]: any }, output: { [x: string]: any }, offset: number) {
    let lng = input[offset]
    let lat = input[offset + 1]
    if (!outOfChina(lng, lat)) {
      const deltaD = delta(lng, lat)
      lng = lng + deltaD[0]
      lat = lat + deltaD[1]
    }
    output[offset] = lng
    output[offset + 1] = lat
  })
}

export const projzh = {
  ll2smerc: getTransform('EPSG:4326', 'EPSG:3857'),
  smerc2ll: getTransform('EPSG:3857', 'EPSG:4326')
}

// wgs84 -> gcj02
projzh.ll2gmerc = function (input: any, opt_output: any, opt_dimension: number | undefined) {
  const output = gcj02.fromWGS84(input, opt_output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}
// gcj02 -> wgs84
projzh.gmerc2ll = function (input: number[] | undefined, opt_output: any, opt_dimension: number | undefined) {
  const output = projzh.smerc2ll(input, input, opt_dimension)
  return gcj02.toWGS84(output, opt_output, opt_dimension)
}
// 3857 -> gcj02
projzh.smerc2gmerc = function (input: number[] | undefined, opt_output: any, opt_dimension: number | undefined) {
  let output = projzh.smerc2ll(input, input, opt_dimension)
  output = gcj02.fromWGS84(output, output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}
// gcj02 -> 3857
projzh.gmerc2smerc = function (input: number[] | undefined, opt_output: any, opt_dimension: number | undefined) {
  let output = projzh.smerc2ll(input, input, opt_dimension)
  output = gcj02.toWGS84(output, output, opt_dimension)
  return projzh.ll2smerc(output, output, opt_dimension)
}

// 定义 GCJ02 墨卡托投影坐标系
const gcj02Mecator = new Projection({
  code: 'GCJ-02',
  // extent 不能缺少，OpenLayers frame 渲染的时候需要
  extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
  units: 'm'
})

// 将 GCJ02 墨卡托投影坐标系注册进 OpenLayers
addProjection(gcj02Mecator)

// 覆盖默认的转换方法
addCoordinateTransforms('EPSG:4326', gcj02Mecator, projzh.ll2gmerc, projzh.gmerc2ll)
addCoordinateTransforms('EPSG:3857', gcj02Mecator, projzh.smerc2gmerc, projzh.gmerc2smerc)

export default gcj02Mecator
