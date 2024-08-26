
import { LineString, MultiPoint, Point, Polygon } from 'ol/geom'
import Feature from 'ol/Feature'
import { getVectorContext } from 'ol/render.js'
import { Fill, RegularShape, Stroke, Style, Circle as CircleStyle, Circle } from 'ol/style.js'
import OlStyleIcon from 'ol/style/Icon'
import { animationDefaultStyle, animationIconMarkerStyle, animationStartMarkerStyle } from '../style'

export default class Animation {
    [x: string]: any
    constructor(comp: any, options: { coordinates: any }) {
        this.layerId = `animation${new Date().toLocaleString()}`
        this.comp = comp
        this.coordinates = options.coordinates
        this.speed = 50
        this.distance = 0
        this.lastTime = 0
        this.vectorLayer = null
        this.route = null
        this.routeFeature = null
        this.startMarker = null
        this.endMarker = null
        this.position = null
        this.geoMarker = null
        this.iconMarker = null
        this.init()
    }
    setSpeed(speed: number) {
        this.speed = speed
    }
    moveFeatureBind = this.moveFeature.bind(this)
    moveFeature(event: any) {
        const time = event.frameState.time
        const elapsedTime = time - this.lastTime
        this.distance = (this.distance + (this.speed * elapsedTime) / 1e6) % 2
        // if (this.distance >= 1) {
        //     this.stopAnimation()
        // }
        this.lastTime = time

        const currentCoordinate = this.route.getCoordinateAt(
            this.distance > 1 ? 2 - this.distance : this.distance
        )
        this.position.setCoordinates(currentCoordinate)
        const vectorContext = getVectorContext(event)
        vectorContext.setStyle(animationIconMarkerStyle.call(this))
        vectorContext.drawGeometry(this.position)
        // tell OpenLayers to continue the postrender animation
        this.comp.map?.render()
    }
    startAnimation() {
        // this.distance = 0
        this.lastTime = Date.now()
        this.vectorLayer.on('postrender', this.moveFeatureBind)
        // hide geoMarker and trigger map render through change event
        this.geoMarker.setGeometry(null)
    }
    stopAnimation() {
        // Keep marker at current animation position
        this.geoMarker.setGeometry(this.position)
        this.vectorLayer.un('postrender', this.moveFeatureBind)
    }
    init() {
        this.route = new LineString(this.coordinates)
        this.routeFeature = new Feature({
            geometry: this.route
        })
        this.vectorLayer = this.comp.addVectorLayer(this.layerId)
        this.startMarker = new Feature({
            geometry: new Point(this.route.getFirstCoordinate())
        })
        this.startMarker.setStyle(animationStartMarkerStyle.call(this))
        this.endMarker = new Feature({
            geometry: new Point(this.route.getLastCoordinate())
        })
        this.endMarker.setStyle(animationStartMarkerStyle.call(this))

        this.position = this.startMarker.getGeometry().clone()

        this.geoMarker = new Feature({
            geometry: this.position
        })
        this.geoMarker.setStyle(animationDefaultStyle.call(this))

        this.iconMarker = new Feature({
            geometry: this.position
        })
        this.iconMarker.setStyle(animationIconMarkerStyle.call(this))

        this.vectorLayer.getSource().addFeature(this.iconMarker)
        this.vectorLayer.getSource().addFeature(this.startMarker)
        this.vectorLayer.getSource().addFeature(this.endMarker)
        this.vectorLayer.getSource().addFeature(this.routeFeature)
        this.vectorLayer.getSource().addFeature(this.geoMarker)
    }
    destory() {
        this.vectorLayer.getSource().removeFeature(this.iconMarker)
        this.vectorLayer.getSource().removeFeature(this.startMarker)
        this.vectorLayer.getSource().removeFeature(this.endMarker)
        this.vectorLayer.getSource().removeFeature(this.routeFeature)
        this.vectorLayer.getSource().removeFeature(this.geoMarker)
        this.iconMarker = null
        this.startMarker = null
        this.endMarker = null
        this.routeFeature = null
        this.geoMarker = null
        this.comp.removeLayerById(this.layerId)
    }
}
