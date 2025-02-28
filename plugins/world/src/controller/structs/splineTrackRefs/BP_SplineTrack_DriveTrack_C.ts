import { Struct, StructInfo } from "@rrox/api";
import { SplineTrackType } from "../../../shared";
import { ASplineTrack } from "../arr/SplineTrack";

@Struct( "BlueprintGeneratedClass BP_SplineTrack_DriveTrack.BP_SplineTrack_DriveTrack_C" )
export class ABP_SplineTrack_DriveTrack_C extends ASplineTrack {

    constructor( struct: StructInfo<ABP_SplineTrack_DriveTrack_C> ) {
        super( struct );
        struct.apply( this );
    }

    public readonly type = SplineTrackType.DRIVETRACK;

}