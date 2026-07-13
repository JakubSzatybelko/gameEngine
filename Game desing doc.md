https://backterria.itch.io/the-roguelike

Game project working name: Poison seller

rougelike autobattler where you select a team of up to 3 heros and try to defeat the demon king big boss at the end/
game play loop consist of 3 screens world view,team view and battle view. Main menu, settings credits to support
inpistation: path of Arca. he is comming and loop hero, path of exile
bonus scope is a town building screen that persist between games and lets you unlock and upgrade gameplay mechanics like: hero, stat boost and special powerups
Main appeal of the game is huge ammount of elements that can combo off of eachother, items, heros, mechanics and maybe some pregame mechanic selection.
whole point is to make super overpower build or well you loose otherwise

scope of the demo:
6 heros
4 enemies
1 boss
world map
basic gameplay loop

infra:
All funtions are pubic by deafult to speed up development and avoid stupid bugs
Static Gameobject Game <-acessable from everywhere to provide game state and logic across files, also global logic for things like settings and saveStates
    public function save
    public function load
    public bool areSettingsOpen
    public bool isGamePaused
    ...ect
Static Gameobject TeamController <- State of the team, fo heros objects, their stats and items, inventory and basic logic like Add hero, kill hero ect.
Static Gameobject MapController <- mostly to hold map data since it's gonna be array of 400x400 objects minimum it can get quite big so we need seperate entity to hold all that data in memory in easy to optimize way, this is the only performance heavy thing in the game and biggest bottleneck of preformance.
Static Gameobject BattleController <- All of the battle logic also contaning enemy team and all the logic to manipulate it
        public enemyTeam
        public GenerateEnemyTeam
        public StartBattle

Battle is automatic and works like that: unit speed will detemine how much Inicative will generate each tick (turn) in innicative reaches 100, unit perform it's action and set it's innicative to 0; by deafault each unit has 20 speed, max speed is 100, minimum is 0. more details see #speed
Battle process:
- Battle Start (battle_start trigger)
- Start Loop:
    - check if battle ended
    - resolve begging of the turn effects (turn_start trigger)
    - check if any unit has 100 inicative
        - if yes do move (see #Battle_Triggers)
    - resolve end of tun effects (turn_end trigger)
    - addvance inicative (inicativve_gain trigger)
- Battle End -> show rewards

Heros:
All heros have:
 lvl: int
 hp int
 speed int
 armour int
 dex int
 str int
 int int
 statuses []
 unlocks []

 str,dex and int are stats used to calculate dmg, str also gives bonus to hp, dex gives dogde chanse, int gives crit chanse.
 All heros have 3 paths they can spec into after reaching lvl 10 called assensions. (not all avalible for demo).
 Each Hero has a skill tree and secondary assension tree you get one point each level and can allocate point to give heros power. the more powerfull the skill the more points it cost, givng more strategic way to level up heros.
 by deafult each hero has only one move: Attack, by leveling up and gearing they can unlock more.
 Hero skills are special interaction mechanic, that will make combat more interactive allong with health potions. they can be clicked on during combat and they will trigger regardless of heros inicative but will still drain they initative down to 0. (this feature is subject to change after play tests)

Heros:
- Potion Seller < Hero who specialises in applying negative statuses to enemies and buffing ally heros, very weak early very powerfull late game.
    - Poison seller < Assesion focused on posion stacking, posion based attacks and skills, 
    - Plauge doctor < Strait upgrade to base class, still focusing on statues both buffing and weaking but now has good healing options also can cleare negavie statuses off of teamates
    - Alcemist < Upgrades flask based attacks, giving them bonus powerfull effects
- Swordsman < hooman fighter you know the drill
    - samurai -dex
    - arcane knight - int
    - dual wielder - allows 2 weapons and gives item boosts
-