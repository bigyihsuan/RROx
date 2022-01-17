import React, { useContext, useEffect, useRef } from 'react';
import { SplineType, BuildSplinePoints } from '@rrox/types';
import * as d3 from 'd3';
import { DraggableModal } from 'ant-design-draggable-modal';
import { MapContext } from '../..';
import { SplineDefinitions } from '../../definitions/Spline';
import { useMap } from 'react-leaflet';
import { Modal, Spin } from 'antd';

export function HeightGraph( { data, onClose }: { data: 'loading' | BuildSplinePoints, onClose: () => void } ) {
    const map = useMap();
    const { HeightData: heightData, Segments, Type } = data === 'loading' ? {} as BuildSplinePoints : data;

    const { actions } = useContext( MapContext );
    const container = useRef<HTMLDivElement>();

    useEffect( () => {
        if( data === 'loading' )
            return;

        const distance = d3.max( heightData, ( d ) => d.distance )

        const margin = {top: 5, right: 25, bottom: 60, left: 20},
            margin2 = {top: 350, right: 25, bottom: 0, left: 20},
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom,
            height2 = 400 - margin2.top - margin2.bottom;

        // append the svg object to the body of the page
        const svg = d3.select( container.current )
            .append( 'svg' )
            .attr( 'width', width + margin.left + margin.right )
            .attr( 'height', height + margin.top + margin.bottom )
            .append( 'g' )
            .attr( 'transform',
                'translate(' + margin.left + ',' + margin.top + ')' );

        svg.append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height);

        // Create focus (graph) and context (slider) areas
        const focus = svg.append("g")
                .attr("class", "focus")
                .attr("clip-path", "url(#clip)")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        const context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        // Create X and Y scales
        const x = d3.scaleLinear()
            .domain( [ 0, distance ] )
            .range( [ 0, width ] );
        const y = d3.scaleLinear()
            .domain( [ d3.min( heightData, ( d ) => Math.min( ...d.heights.map( ( h ) => h.height ) ) ) - 1000, d3.max( heightData, ( d ) => Math.max( ...d.heights.map( ( h ) => h.height ) ) ) + 1000 ] )
            .range(  [ height, 0 ] );

        // Create Selector scales
        const x2 = d3.scaleLinear()
            .domain( [ 0, distance ] )
            .range( [ 0, width ] );
        const y2 = d3.scaleLinear()
            .domain( y.domain() )
            .range(  [ height2, 0 ] );

        let formatted: { id: number, type: SplineType, distance: number, height: number }[] = [];
        let terrain: { distance: number, height: number }[] = [];
        for( let data of heightData )
            for( let height of data.heights )
                if( height.type === 'TERRAIN' )
                    terrain.push( { distance: data.distance, height: height.height } );
                else
                    formatted.push( {
                        id: height.id,
                        type: height.type,
                        distance: data.distance,
                        height: height.height
                    } );
        let grouped = d3.group( formatted, ( f ) => f.id );

        const splineArea = ( d: [ number, ( typeof formatted )[ number ][] ] ) => d3.area<( typeof formatted )[ number ]>()
            .x( ( d ) => x( d.distance ) )
            .y0( ( d ) => y( d.height - SplineDefinitions[ d.type ].height ) )
            .y1( ( d ) => y( d.height ) ) 
            ( d[ 1 ] );

        focus.selectAll( '.line' )
            .data( grouped )
            .join( 'path' )
            .attr( 'class', 'spline' )
            .attr( 'fill', ( data ) => data[ 1 ].length === 0 ? '#000' : actions.getColor( `spline.${data[ 1 ][ 0 ].type}` ) )
            .attr( 'd', splineArea );

        const terrainArea = d3.area<{ distance: number, height: number }>()
            .x( ( data ) => x( data.distance ) )
            .y0( height )
            .y1( ( data ) => y( data.height ) );

        const terrainArea2 = d3.area<{ distance: number, height: number }>()
            .x( ( data ) => x2( data.distance ) )
            .y0( height2 )
            .y1( ( data ) => y2( data.height ) );

        let line: { distance: number, point: [ number, number, number ] }[] = [];
        if( Segments.length > 0 )
            line.push( { distance: 0, point: Segments[ 0 ].LocationStart } );
        for( let segment of Segments )
            line.push( { distance: segment.PathDistance, point: segment.LocationEnd } );

        const currentSplineArea = d3.area<( typeof line )[ number ]>()
            .x( ( d ) => x( d.distance ) )
            .y0( ( d ) => y( d.point[ 2 ] - SplineDefinitions[ Type ].height ) )
            .y1( ( d ) => y( d.point[ 2 ] ) );

        focus.append( 'path' )
            .datum( line )
            .attr( 'class', 'current-spline' )
            .attr( 'fill', actions.getColor( `spline.${Type}` ) )
            .attr( 'd', currentSplineArea );

                    

        // Add terrain
        focus.append( 'path' )
            .datum( terrain )
            .attr( 'class', 'terrain' )
            .attr( 'fill', 'lightgray' )
            .attr( 'd', terrainArea );

        // Add terrain to small slider
        context.append( 'path' )
            .datum( terrain )
            .attr( 'class', 'terrain' )
            .attr( 'fill', 'lightgray' )
            .attr( 'd', terrainArea2 );

        // Add Y axis
        svg.append( 'g' )
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call( d3.axisLeft( y ) );

        // Zoom and Brush Logic

        let blocked = false;

        let clickable: d3.Selection<SVGGElement, unknown, null, undefined> = null;

        const brush = d3.brushX()
            .extent( [ [ 0, 0 ], [ width, height2 ] ] )
            .on( "brush end", ( e: d3.D3BrushEvent<unknown> ) => {
                if ( blocked )
                    return;
                let s = ( e.selection || x2.range() ) as [ number, number ];
                x.domain( s.map( x2.invert, x2 ) );
                focus.select(".terrain").attr("d", terrainArea);
                focus.select(".spline").attr("d", splineArea);
                focus.select(".current-spline").attr("d", currentSplineArea);
                clickable?.selectAll(".points")
                    .attr( 'cx', ( d: ( typeof line )[ number ] ) => x( d.distance ) )
                    .attr( 'cy', ( d: ( typeof line )[ number ] ) => y( d.point[ 2 ] ) );
                blocked = true;
                svg.select( ".zoom" ).call( zoom.transform as any, d3.zoomIdentity
                    .scale( width / ( s[ 1 ] - s[ 0 ] ) )
                    .translate( -s[ 0 ], 0 ) );
                blocked = false;
            } );

        const zoom = d3.zoom()
            .scaleExtent( [ 1, Infinity ] )
            .translateExtent( [ [ 0, 0 ], [ width, height ] ] )
            .extent( [ [ 0, 0 ], [ width, height ] ] )
            .on( "zoom", ( e: d3.D3ZoomEvent<SVGElement, unknown> ) => {
                if ( blocked )
                    return;
                let t = e.transform;
                x.domain( t.rescaleX( x2 ).domain() );
                focus.select(".terrain").attr("d", terrainArea);
                focus.select(".spline").attr("d", splineArea);
                focus.select(".current-spline").attr("d", currentSplineArea);
                clickable?.selectAll(".points")
                    .attr( 'cx', ( d: ( typeof line )[ number ] ) => x( d.distance ) )
                    .attr( 'cy', ( d: ( typeof line )[ number ] ) => y( d.point[ 2 ] ) );
                blocked = true;
                svg.select( '.brush' ).call( brush.move as any, x.range().map( t.invertX, t ) );
                blocked = false
            } );

        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());
      

        const zoomBox = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .style("cursor", "move")
            .style("pointer-events", "all")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);

        // Vertical Line
        svg.append('line')
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", height)
            .style("display", "none")
            .style("pointer-events", "none")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("stroke", "steelblue")
            .attr('class', 'verticalLine')

        zoomBox
            .on("mouseout", () => {
                svg.select(".verticalLine").style("display", "none");
                map?.fire( 'show-path-distance', { distance: 0, totalDistance: distance } );
            })
            .on("mouseover", () => svg.select(".verticalLine").style("display", null))
            .on( 'mousemove', function ( e ) {
                let pos = d3.pointer( e, this );

                let d = x.invert( pos[ 0 ] );

                map?.fire( 'show-path-distance', { distance: d, totalDistance: distance } );

                svg.select(".verticalLine")
                    .attr("x1", pos[ 0 ] )
                    .attr("x2", pos[ 0 ] );
            } );
  
        // Create clickable container (on top of zoom rect)
        clickable = svg.append("g")
            .attr("clip-path", "url(#clip)")
            .attr("class", "clickable")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add clickable circles
        clickable.selectAll( '.points' )
            .data( line )
            .join( 'circle' )
            .attr( 'class', 'points' )
            .attr( 'r', 5 )
            .attr( 'cx', ( d ) => x( d.distance ) )
            .attr( 'cy', ( d ) => y( d.point[ 2 ] ) )
            .style( 'cursor', 'pointer' )
            .style( 'fill', 'steelblue' );

        clickable.selectAll( 'circle' )
            .call( d3.drag()
                .on( 'drag', function( e: MouseEvent, d: ( typeof line )[ number ] ) {
                    d.point[ 2 ] = y.invert( e.y );
                    d3.select( this ).attr( 'cy', y( d.point[ 2 ] ) );
                    focus.select(".current-spline").attr("d", currentSplineArea);
                } )
            );

        return () => {
            svg.remove();
            while( container.current && container.current.children.length > 0 )
                container.current.removeChild( container.current.children[ 0 ] );
        };
    }, [ container.current, data ] );

    return <Modal
        title={'Customize height'}
        visible={true}
        footer={null}
        onCancel={onClose}
        destroyOnClose={true}
        zIndex={2000}
        mask={true}
        maskClosable={false}
        width={650}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        style={{
            top: 'calc(100vh - 555px)',
            marginRight: 10,
            paddingBottom: 0,
        }}
    >
        {data === 'loading'
            ? <Spin style={{ width: 600, height: 440, padding: 210 }} tip='Generating heightmap...' />
            : <>
                <div ref={container} />
                <p style={{ textAlign: 'center' }}>When modifying track/groundwork positions, height data will be lost.</p>
            </>}
    </Modal>
}