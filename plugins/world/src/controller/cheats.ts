import { Actions, IPluginController, IQuery, SettingsStore } from "@rrox/api";
import WorldPlugin from ".";
import { ICheats, IWorldSettings } from "../shared";
import { ASCharacter } from "./structs/arr/SCharacter";
import { EMovementMode } from "./structs/Engine/EMovementMode";
import { APawn } from "./structs/Engine/Pawn";
import { APlayerState } from "./structs/Engine/PlayerState";

export class Cheats {
    private pawnQuery: IQuery<APlayerState>;
    private cheatsQuery: IQuery<ASCharacter>;

    private fastSprintPlayers = new Map<ASCharacter, number>();;

    private interval: NodeJS.Timeout;

    constructor( private plugin: WorldPlugin, private settings: SettingsStore<IWorldSettings> ) {}

    public async prepare() {
        const data = this.plugin.controller.getAction( Actions.QUERY );

        this.pawnQuery = await data.prepareQuery( APlayerState, ( player ) => [
            player.PawnPrivate
        ] );

        this.cheatsQuery = await data.prepareQuery( ASCharacter, ( char ) => [
            char.CharacterMovement.MaxFlySpeed,
            char.CharacterMovement.MaxWalkSpeed,
            char.CharacterMovement.MovementMode,
        ] );
    }

    public start() {
        this.stop();

        const data = this.plugin.controller.getAction( Actions.QUERY );

        this.interval = setInterval( async () => {
            if( !this.settings.get( 'features.cheats' ) ) {
                this.fastSprintPlayers.clear();
            }

            for( let [ character, speed ] of this.fastSprintPlayers ) {
                const latestData = await data.query( this.cheatsQuery, character );
                if( !latestData || latestData.CharacterMovement.MaxWalkSpeed === 200 )
                    continue;

                latestData.CharacterMovement.MaxWalkSpeed = speed;

                await data.save( latestData.CharacterMovement );
            }
        }, 500 );
    }

    public stop() {
        clearInterval( this.interval );
        this.fastSprintPlayers.clear();
    }

    private async getCharacter( player: APlayerState ): Promise<ASCharacter> {
        const data = this.plugin.controller.getAction( Actions.QUERY );

        let pawn: APawn;
        if( player.PawnPrivate )
            pawn = player.PawnPrivate;
        else {
            const p = await data.query( this.pawnQuery, player );
            if( !p?.PawnPrivate )
                throw new Error( 'Could not find player to get cheats for.' );

            pawn = player.PawnPrivate;
        }
        
        const character = await data.cast( pawn, ASCharacter );

        if( !character )
            throw new Error( 'Could not find character to get cheats for.' );

        const cheats = await data.query( this.cheatsQuery, character );

        if( !cheats || !cheats.CharacterMovement )
            throw new Error( 'Could not retrieve character cheats.' );

        return cheats;
    }

    public async getCheats( player: APlayerState ): Promise<ICheats> {
        const data = this.plugin.controller.getAction( Actions.QUERY );

        const character = await this.getCharacter( player );

        const fastSprintKey = Array.from( this.fastSprintPlayers.keys() ).find( ( p ) => data.equals( p, character ) );
    
        return {
            flySpeed: character.CharacterMovement.MovementMode === EMovementMode.MOVE_Flying ? character.CharacterMovement.MaxFlySpeed : undefined,
            walkSpeed: fastSprintKey ? this.fastSprintPlayers.get(fastSprintKey) : undefined,
        }
    }

    public async setCheats( player: APlayerState, cheats: ICheats ): Promise<void> {
        if( !this.settings.get( 'features.cheats' ) )
            return;

        const data = this.plugin.controller.getAction( Actions.QUERY );

        const character = await this.getCharacter( player );
    
        if( cheats.flySpeed ) {
            character.CharacterMovement.MovementMode = EMovementMode.MOVE_Flying;
            character.CharacterMovement.MaxFlySpeed = cheats.flySpeed;
        } else {
            character.CharacterMovement.MovementMode = EMovementMode.MOVE_Walking;
        }

        const keys = Array.from( this.fastSprintPlayers.keys() ).filter( ( p ) => data.equals( p, character ) );
        for( let key of keys )
            this.fastSprintPlayers.delete( key );

        if( cheats.walkSpeed ) {
            this.fastSprintPlayers.set( character, cheats.walkSpeed );
        }

        await data.save( character.CharacterMovement );
    }

    public async setMoneyXP( player: APlayerState, money?: number, xp?: number ): Promise<void> {
        if( !this.settings.get( 'features.cheats' ) )
            return;

        const data = this.plugin.controller.getAction( Actions.QUERY );

        const character = await this.getCharacter( player );

        if( money )
            await character.ChangePlayerMoney( money );
        if( xp )
            await character.ChangePlayerXP( xp );

        await data.save( character.CharacterMovement );
    }
}