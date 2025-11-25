"use strict";
// region of region
const durableEffects = [
    "aging",
    "rage",
    "weakness",
    "lucky",
    "accuracy",
    "slow",
    "hast",
];
function makeClone(target) {
    return { type: "clone", copy: JSOG.parse(JSOG.stringify(target)) };
}
function makeBallista(count = 1) {
    return {
        count,
        type: "ballista",
        arrowsLeft: 20,
        lastHealth: stackHealth.ballista,
        effects: [],
        initialCount: count,
    };
}
const aidTentHeal = 30;
function makeAidTent(count = 1) {
    return {
        count,
        type: "aidTent",
        lastHealth: stackHealth.aidTent,
        effects: [],
        initialCount: count,
    };
}
function stackOf(type, count = 1) {
    if (type === "aidTent") {
        return makeAidTent(count);
    }
    if (type === "ballista") {
        return makeBallista(count);
    }
    return {
        count,
        type,
        lastHealth: stackHealth[type],
        effects: [],
        initialCount: count,
    };
}
function stackWidth(stack) {
    const type = stack.type;
    switch (type) {
        case "clone":
            return stackWidth(stack.copy);
        case "dragon":
            return 2;
        case "gargoyle":
        case "griffin":
        case "vampire":
        case "zombie":
        case "archer":
        case "dendroid":
        case "pikeman":
        case "angel":
        case "devil":
        case "enhancedArcher":
        case "ballista":
        case "aidTent":
            return 1;
        default:
            never(type);
    }
}
const speeds = {
    ballista: 0,
    aidTent: 0,
    gargoyle: 7,
    griffin: 10,
    vampire: 8,
    pikeman: 6,
    archer: 5,
    enhancedArcher: 7,
    dendroid: 5,
    zombie: 4,
    dragon: 11,
    devil: 10,
    angel: 12,
};
function toRealStack(stack) {
    if (stack.type === "clone") {
        return stack.copy;
    }
    return stack;
}
function baseSpeedOf(stack) {
    const value = (() => {
        stack = toRealStack(stack);
        const speed = speeds[stack.type];
        const slow = effectIn(stack, "slow");
        if (slow) {
            return Math.max(1, speed - slow.value);
        }
        const hast = effectIn(stack, "hast");
        if (hast) {
            return Math.max(1, speed + hast.value);
        }
        return speed;
    })();
    return Math.min(14, Math.max(1, value));
}
function movementOf(stack) {
    if (!stack) {
        return 0;
    }
    if (effectIn(stack, "freeze")) {
        return 0;
    }
    return baseSpeedOf(stack);
}
const stackHealth = {
    aidTent: 200,
    ballista: 120,
    gargoyle: 25,
    griffin: 35,
    vampire: 50,
    zombie: 10,
    dragon: 200,
    archer: 12,
    enhancedArcher: 8,
    dendroid: 40,
    pikeman: 11,
    angel: 180,
    devil: 190,
};
function healthOf(stack) {
    stack = toRealStack(stack);
    const health = stackHealth[stack.type];
    if (!stack.effects.some(i => i.type === "aging")) {
        return health;
    }
    return health / 2;
}
const hates = {
    angel: "devil",
    devil: "angel",
};
function levelToPercent(level) {
    if (level === 1) {
        return .25;
    }
    return .5;
}
function attackOf(args) {
    const { attacker, type, defender } = args;
    const attackerStack = toRealStack(attacker.stack);
    const defenderStack = toRealStack(defender.stack);
    const hasHate = hates[attackerStack.type] === defenderStack.type;
    function hateAttack(min, max) {
        if (hasHate) {
            return Math.round(max * 1.2);
        }
        return min;
    }
    function forceCalculate(min, max) {
        return Math.round(min + random(game.seed) * (max - min));
    }
    function calculate(min, max) {
        let damage = forceCalculate(min, max);
        let lucky = false;
        let accuracy = 1;
        for (let i of attackerStack.effects) {
            if (type === "fire" && i.type === "accuracy") {
                accuracy = i.value;
                continue;
            }
            switch (i.type) {
                case "bless":
                    damage = hateAttack(max, max);
                    break;
                case "rage":
                    damage = hateAttack(max * 1.25, max * 1.25);
                    break;
                case "weakness":
                    damage = hateAttack(min, min);
                    break;
                case "lucky":
                    lucky = getLucky(levelToProbability(i.level));
                    break;
            }
        }
        for (let i of defenderStack.effects) {
            if (type === "fire" && i.type === "airShield") {
                damage *= 1 - levelToPercent(i.value);
            }
        }
        if (unitKind(attackerStack) !== "undead" && (lucky || getLucky(levelToProbability(attacker.hero.lucky)))) {
            damage *= 2;
        }
        if (hasHate) {
            damage *= 1.2;
        }
        return damage * accuracy;
    }
    const stackType = attackerStack.type;
    if (type === "hand") {
        switch (stackType) {
            case "gargoyle":
                return calculate(10, 20);
            case "griffin":
                return calculate(10, 40);
            case "vampire":
                return calculate(15, 30);
            case "pikeman":
                return calculate(4, 6);
            case "archer":
                return calculate(2, 5);
            case "enhancedArcher":
                return calculate(4, 7);
            case "dendroid":
                return calculate(15, 25);
            case "zombie":
                return calculate(3, 6);
            case "dragon":
                return calculate(30, 60);
            case "angel":
                return calculate(50, 50);
            case "devil":
                return calculate(40, 50);
            case "aidTent":
            case "ballista":
                return 0;
            default: {
                never(stackType);
            }
        }
    }
    switch (stackType) {
        case "archer":
            return calculate(6, 9);
        case "enhancedArcher":
            return calculate(12, 16);
        case "ballista":
            return calculate(20, 30);
        case "gargoyle":
        case "griffin":
        case "vampire":
        case "pikeman":
        case "dendroid":
        case "zombie":
        case "dragon":
        case "angel":
        case "devil":
        case "aidTent":
            return 0;
        default:
            never(stackType);
    }
}
const spellSchool = {
    forgetfulness: "water",
    antiMagic: "earth",
    hypnotize: "earth",
    forceField: "earth",
    fireWall: "fire",
    airShield: "air",
    frostRing: "water",
    clone: "water",
    arrow: "earth",
    lightning: "air",
    slow: "earth",
    hast: "air",
    bless: "water",
    rage: "fire",
};
const spellDamage = {
    frostRing: 12,
    arrow: 30,
    lightning: 50,
    fireWall: 20,
};
function spellLevel(spell) {
    const caster = currentSide();
    if (spell === "arrow") {
        let level = 0;
        caster.skills.forEach(i => {
            const type = i.type;
            switch (type) {
                case "mirror":
                case "resistance":
                case "tactic":
                case "machine":
                    return;
                case "earth":
                case "air":
                case "fire":
                case "water":
                    return level = Math.max(i.level, level);
                default:
                    never(type);
            }
        });
        return level;
    }
    const skill = skillIn(caster, spellSchool[spell]);
    if (!skill) {
        return 0;
    }
    return skill.level;
}
function spellAttackOf(spell) {
    const base = spellDamage[spell] * (1 + spellLevel(spell) / 3);
    return Math.ceil(base + base * currentSide().hero.spell / 10);
}
const defences = {
    aidTent: 3,
    ballista: 8,
    gargoyle: 4,
    griffin: 5,
    vampire: 5,
    zombie: 3,
    dragon: 8,
    archer: 4,
    enhancedArcher: 6,
    dendroid: 7,
    pikeman: 4,
    angel: 10,
    devil: 7,
};
function defenceOf(stack) {
    stack = toRealStack(stack);
    const base = defences[stack.type];
    if (!game.defencedInCurrentRound.includes(stack) && !game.defencedInPreviousRound.includes(stack)) {
        return base;
    }
    return Math.ceil(base * 1.1);
}
// endregion
// region battle
function attackTypeOf(stack) {
    return canFire(stack) ? "fire" : "hand";
}
function currentAttackType() {
    const type = game.attackType;
    return type.selected ? type.selected : type.default;
}
function ally() {
    return game.ally;
}
function foe() {
    return game.foe;
}
function nextRound() {
    [...ally().army, ...foe().army].forEach(stack => {
        durableEffects.forEach(effect => {
            const target = effectIn(stack, effect);
            if (!target) {
                return;
            }
            target.duration -= 1;
            if (target.duration <= 0) {
                stack = toRealStack(stack);
                stack.effects.splice(stack.effects.indexOf(target), 1);
            }
        });
    });
    const selected = nextInQueue();
    game = {
        type: "battle",
        state: { type: "playing" },
        moved: [],
        defendedAttack: [],
        waited: [],
        morale: [],
        heroesCastedSpell: [],
        defencedInCurrentRound: [],
        defencedInPreviousRound: game.defencedInCurrentRound,
        attackType: { default: attackTypeOf(selected) },
        selected,
        seed: defaultSeed,
        ally: game.ally,
        foe: game.foe,
    };
    onTurnStarted();
}
function nextInQueue() {
    const stack = gameQueue()[0];
    if (!stack) {
        throw new Error("Can't find next");
    }
    return stack;
}
function armyHas(army) {
    for (let i = 0; i < army.length; i++) {
        const stack = army[i];
        if (stack.type !== "clone" && unitKind(stack) !== "machine") {
            return true;
        }
    }
    return false;
}
function nextTurn() {
    if (!armyHas(ally().army)) {
        return game.state = { type: "end", winner: foe() };
    }
    if (!armyHas(foe().army)) {
        return game.state = { type: "end", winner: ally() };
    }
    const selected = nextInQueue();
    game.selected = selected;
    game.morale = [];
    clearRect(availableHover);
    if (game.type === "battle" && game.moved.includes(selected)) {
        return nextRound();
    }
    onTurnStarted();
}
function firstDamagedFriend() {
    return currentSide().army.find(i => {
        const stack = toRealStack(i);
        return stack.lastHealth !== stackHealth[stack.type];
    });
}
function ensureAdded(array, value) {
    if (!array.includes(value)) {
        array.push(value);
    }
}
function onTurnStarted() {
    if (currentSide().skills.find(i => i.type === "machine")) {
        if (selectedType() === "aidTent" && !firstDamagedFriend()) {
            ensureAdded(game.moved, selected());
            doAction({ type: "nextTurn" });
            return;
        }
        return;
    }
    switch (selectedType()) {
        case "ballista": {
            const position = positionOf(stackEnemy(selected()).army[0]);
            doAction({
                type: "fireAt",
                hexPosition: position,
            });
            return;
        }
        case "aidTent": {
            const target = firstDamagedFriend();
            if (!target) {
                ensureAdded(game.moved, selected());
                doAction({ type: "nextTurn" });
                return;
            }
            doAction({
                type: "tryHealAndNextTurn",
                stackPosition: positionOf(target),
                value: aidTentHeal,
            });
            return;
        }
        default: {
            const position = positionOf(selected());
            const hex = hexAt(position);
            const stack = stackFromHex(hex);
            if (!stack || !hex) {
                return;
            }
            return stackSteppingOn({ hex, stack });
        }
    }
}
function mapArmyToQueue(side, owner) {
    return side.army.map(stack => ({
        speed: baseSpeedOf(stack),
        stack,
        owner: owner || stackOwner(stack) === ally() ? "ally" : "foe",
    }));
}
// there should be no direct game using
function gameQueueFor(args) {
    const { previousSide, elements, waited, moved } = args;
    elements.sort((a, b) => b.speed - a.speed);
    const sameSpeed = {};
    const machines = [];
    const sameWaitedSpeed = {};
    const waitedMachines = [];
    const sameMovedSpeed = {};
    const movedMachines = [];
    for (const el of elements) {
        const kind = unitKind(el.stack);
        if (waited.includes(el.stack)) {
            if (!sameWaitedSpeed[el.speed]) {
                sameWaitedSpeed[el.speed] = [];
            }
            if (kind === "machine") {
                waitedMachines.push(el);
            }
            else {
                sameWaitedSpeed[el.speed].push(el);
            }
            continue;
        }
        if (moved.includes(el.stack)) {
            if (!sameMovedSpeed[el.speed]) {
                sameMovedSpeed[el.speed] = [];
            }
            if (kind === "machine") {
                movedMachines.push(el);
            }
            else {
                sameMovedSpeed[el.speed].push(el);
            }
            continue;
        }
        if (!sameSpeed[el.speed]) {
            sameSpeed[el.speed] = [];
        }
        if (kind === "machine") {
            machines.push(el);
        }
        else {
            sameSpeed[el.speed].push(el);
        }
    }
    const sorted = Object.keys(sameSpeed)
        .map(Number)
        .sort((a, b) => b - a);
    const waitedSorted = Object.keys(sameWaitedSpeed)
        .map(Number)
        .sort((a, b) => b - a);
    const movedSorted = Object.keys(sameMovedSpeed)
        .map(Number)
        .sort((a, b) => b - a);
    const result = [];
    function loop(sorted, sameSpeed, side) {
        for (const speed of sorted) {
            const group = sameSpeed[speed];
            if (group.length === 1) {
                result.push(group[0]);
                continue;
            }
            const allyGroup = group.filter(g => g.owner === "ally");
            const foeGroup = group.filter(g => g.owner === "foe");
            if (!allyGroup.length || !foeGroup.length) {
                return result.push(...group);
            }
            let turn = (result[result.length - 1]?.owner || side) === "ally" ? "foe" : "ally";
            while (allyGroup.length || foeGroup.length) {
                if (turn === "ally" && allyGroup.length) {
                    const item = allyGroup.shift();
                    if (item) {
                        result.push(item);
                    }
                }
                else if (turn === "foe" && foeGroup.length) {
                    const item = foeGroup.shift();
                    if (item) {
                        result.push(item);
                    }
                }
                turn = turn === "ally" ? "foe" : "ally";
            }
        }
    }
    result.push(...machines);
    loop(sorted, sameSpeed, previousSide);
    result.push(...waitedMachines);
    loop(waitedSorted, sameWaitedSpeed);
    result.push(...movedMachines);
    loop(movedSorted, sameMovedSpeed);
    return result.map(i => i.stack);
}
function sideName(side) {
    return side === ally() ? "ally" : "foe";
}
function currentSideName() {
    return sideName(currentSide());
}
function gameQueue() {
    let elements;
    switch (game.type) {
        case "spelling":
        case "battle":
            elements = [
                ...mapArmyToQueue(game.ally),
                ...mapArmyToQueue(game.foe),
            ];
            break;
        case "tactic":
            elements = mapArmyToQueue(game.side);
            break;
        default:
            never(game);
    }
    return gameQueueFor({
        elements,
        waited: game.waited,
        moved: game.moved,
        previousSide: currentSideName()
    });
}
function fromDiapason(value, min, max) {
    if (min >= max) {
        throw new Error("Min > max");
    }
    if (value >= max) {
        return max;
    }
    if (value <= min) {
        return min;
    }
    return value;
}
function totalStackHealth(stack) {
    stack = toRealStack(stack);
    if (stack.count === 0) {
        return 0;
    }
    return healthOf(stack) * (stack.count - 1) + stack.lastHealth;
}
function columnRowInLine({ attacker, defender }) {
    const attack = positionPointOf(attacker);
    const normalized = normalizedPosition(positionPointOf(defender), attack);
    attack.x += normalized.x * hexWidth * 2;
    attack.y += normalized.y * hexHeight * 2;
    return hexAtPoint(attack);
}
function singleAttack(args) {
    const { hero: attackerHero, stack: attacker } = args.attacker;
    const { hero: defenderHero, stack: defender } = args.defender;
    if (toRealStack(defender).count <= 0) {
        return [];
    }
    const attack = fromDiapason(defenderHero.defence + defenceOf(defender) - attackerHero.attack, -9, 9) / 10;
    const baseDamage = attackOf(args) * toRealStack(attacker).count;
    const result = [applyDamage({ damage: Math.round(baseDamage + baseDamage * attack), receiver: defender })];
    if (result[0]?.type !== "receiverDead" && attacker.type === "dendroid") {
        toRealStack(defender).effects.push({ type: "freeze", causer: attacker });
        result.push({ type: "stopped", receiver: defender });
    }
    return result;
}
function applyDamage({ damage, receiver }) {
    if (receiver.type === "clone") {
        return { type: "cloneAttacked", stack: receiver };
    }
    if (receiver.lastHealth > damage) {
        receiver.lastHealth -= damage;
        return { type: "receiveDamage", damage, receiver };
    }
    const unitHealth = healthOf(receiver);
    const totalHealth = totalStackHealth(receiver);
    const remainTotalHealth = totalHealth - damage;
    if (remainTotalHealth <= 0) {
        receiver.lastHealth = 0;
        receiver.count = 0;
        return { type: "receiverDead", damage: totalHealth, receiver };
    }
    const lastHealth = remainTotalHealth % unitHealth;
    if (lastHealth === 0) {
        receiver.lastHealth = unitHealth;
    }
    else {
        receiver.lastHealth = lastHealth;
    }
    receiver.count = (remainTotalHealth - lastHealth) / unitHealth + 1;
    return { type: "receiveDamage", damage, receiver };
}
function stackOwner(stack) {
    if (stack.type !== "clone" && effectIn(stack, "hypnotize")) {
        return realStackOwner(stack) === ally() ? foe() : ally();
    }
    return realStackOwner(stack);
}
function realStackOwner(stack) {
    return ally().army.includes(stack) ? ally() : foe();
}
function stackEnemy(stack) {
    return stackOwner(stack) === foe() ? ally() : foe();
}
function realStackEnemy(stack) {
    return realStackOwner(stack) === foe() ? ally() : foe();
}
function stackOwnerHero(stack) {
    return stackOwner(stack).hero;
}
function stackFromHex(hex) {
    if (!hex) {
        return;
    }
    return stackHexFrom(hex)?.stack;
}
function directAttack(args) {
    const result = singleAttack(args);
    const attacker = args.attacker.stack;
    if (attacker.type !== "dragon") {
        return result;
    }
    let hetAtPoint = columnRowInLine({ attacker, defender: args.defender.stack });
    if (!hetAtPoint) {
        return result;
    }
    const target = positionOf(args.defender.stack);
    result.unshift({
        type: "flame",
        from: positionOf(attacker),
        to: hetAtPoint ? hetAtPoint : target
    });
    const stack = stackFromHex(hetAtPoint.hex);
    if (!stack) {
        return result;
    }
    if (stack === attacker) {
        return result;
    }
    result.push(...singleAttack({
        attacker: args.attacker,
        defender: {
            stack: stack,
            hero: stackOwnerHero(stack),
        },
        type: args.type,
    }));
    return result;
}
function magicApply(skills) {
    for (const i of skills) {
        if ((i.type === "mirror" || i.type === "resistance") && getLucky(levelToProbability(i.level))) {
            return i;
        }
    }
    return { type: "damage" };
}
function closestStack({ from, excludes }) {
    return closestInRadius({ ...positionOf(from), radius: Infinity, excludes });
}
function closestInRadius({ row, column, radius, excludes }) {
    const positions = [];
    grid.forEach((row, rowIndex) => {
        row.forEach((_, columnIndex) => {
            const stack = stackFromHex(hexAtRowColumn(rowIndex, columnIndex));
            if (stack && !excludes.includes(stack)) {
                positions.push({ row: rowIndex, column: columnIndex, stack });
            }
        });
    });
    let closest = undefined;
    let distance = Infinity;
    for (const position of positions) {
        const newDistance = Math.max(Math.abs(position.row - row), Math.abs(position.column - column));
        if (newDistance < distance && radius >= newDistance) {
            distance = newDistance;
            closest = position;
        }
    }
    return closest && closest.stack;
}
function removeEffect({ effects, removing }) {
    const index = effects.findIndex(i => i.type === removing);
    if (index === -1) {
        return;
    }
    effects.splice(index, 1);
}
function removeFromArray(array, value) {
    const index = array.indexOf(value);
    if (index === -1) {
        return;
    }
    array.splice(index, 1);
}
function spellDuration(spell) {
    return spell + 1;
}
function applyMagicEffect(args) {
    const caster = args.caster;
    const spell = caster.hero.spell;
    const spelling = args.spell;
    function value() {
        const skill = skillIn(caster, spellSchool[spelling]);
        if (!skill) {
            return spell;
        }
        return Math.ceil(spell + spell * skill.level / 3);
    }
    const duration = spellDuration(spell);
    switch (spelling) {
        case "clone": {
            return { type: "clone", target: args.targets[0] };
        }
        case "forgetfulness":
        case "hypnotize": {
            const target = toRealStack(args.targets[0]);
            target.effects.push({
                type: spelling,
                duration,
            });
            return { type: spelling, target };
        }
        case "antiMagic":
            const target = toRealStack(args.targets[0]);
            target.effects.splice(0);
            target.effects.push({
                type: "antiMagic",
                duration,
                level: spellLevel("antiMagic")
            });
            return { type: "antiMagic", target };
        case "airShield":
        case "hast":
        case "bless":
        case "rage":
        case "slow": {
            args.targets.forEach(target => {
                target = toRealStack(target);
                switch (spelling) {
                    case "slow":
                        removeEffect({ effects: target.effects, removing: "hast" });
                        break;
                    case "hast":
                        removeEffect({ effects: target.effects, removing: "slow" });
                        break;
                    case "bless":
                    case "rage":
                    case "airShield":
                        break;
                    default:
                        never(spelling);
                }
                target.effects.push({
                    type: spelling,
                    duration,
                    value: 3 + value()
                });
            });
            return { type: spelling, targets: args.targets };
        }
        default:
            never(spelling);
    }
}
function magicAttack(args) {
    switch (args.spell) {
        case "lightning": {
            let magic = magicApply(args.receiver.skills);
            let damage = args.damage ?? spellAttackOf(args.spell);
            let left = 4;
            const excludes = [];
            const result = [];
            let closest = args.target;
            while (left >= 0) {
                function loop() {
                    if (!closest) {
                        return { type: "empty" };
                    }
                    const currentLeft = left;
                    left -= 1;
                    excludes.push(closest);
                    switch (magic.type) {
                        case "damage": {
                            return applyDamage({ damage, receiver: closest });
                        }
                        case "resistance": {
                            return { type: "resistance", stackPoint: positionPointOf(args.target) };
                        }
                        case "mirror": {
                            closest = closestStack({ from: closest, excludes });
                            if (!closest || currentLeft < 0) {
                                return { type: "resistance", stackPoint: positionPointOf(args.target) };
                            }
                            magic = magicApply(args.receiver.skills);
                            return { type: "reflect", source: closest, effects: [loop()] };
                        }
                        default: {
                            never(magic);
                        }
                    }
                }
                result.push(loop());
                closest = closestStack({ from: closest, excludes });
                if (!closest) {
                    return result;
                }
                damage = Math.ceil(damage / 2);
            }
            return result;
        }
        default: {
            let magic = magicApply(args.receiver.skills);
            let damage = args.damage ?? spellAttackOf(args.spell);
            switch (magic.type) {
                case "damage": {
                    return [applyDamage({ damage, receiver: args.target })];
                }
                case "resistance": {
                    return [{ type: "resistance", stackPoint: positionPointOf(args.target) }];
                }
                case "mirror": {
                    return [{
                            type: "reflect",
                            source: args.target,
                            effects: magicAttack({
                                receiver: args.attacker,
                                attacker: args.receiver,
                                target: args.receiver.army[args.receiver.army.length - 1],
                                spell: args.spell,
                                damage: damage || 0,
                            }),
                        }];
                }
                default:
                    never(magic);
            }
        }
    }
}
function never(arg) {
    throw new Error("Implement required cases" + arg);
}
function heal({ stack, value }) {
    if (stack.type === "clone") {
        return;
    }
    value = Math.round(value);
    const totalHealth = totalStackHealth(stack);
    const unitHealth = healthOf(stack);
    const maxHealth = unitHealth * stack.initialCount;
    if (totalHealth >= maxHealth) {
        return;
    }
    const resultHealth = Math.min(maxHealth, totalHealth + value);
    const lastHealth = resultHealth % unitHealth;
    stack.count = (resultHealth - lastHealth) / unitHealth + 1;
    if (lastHealth === 0) {
        stack.lastHealth = unitHealth;
    }
    else {
        stack.lastHealth = lastHealth;
    }
}
function canHitBack(stack) {
    if (stack.type === "griffin") {
        return [...game.defendedAttack.values()].filter(i => i === stack).length < 2;
    }
    return !game.defendedAttack.includes(stack);
}
function shouldGetHitBack(stack) {
    switch (stack.type) {
        case "devil":
        case "vampire":
            return false;
        default:
            return true;
    }
}
// endregion
// region utils
function random(seed) {
    const m = 2 ** 31;
    const a = 1103515245;
    const c = 12345;
    seed = (a * seed + c) % m;
    return seed / m;
}
function increaseSeed(value) {
    if (game.type === "tactic") {
        return;
    }
    game.seed += value;
}
function getLucky(probability) {
    if (game.type === "tactic") {
        return false;
    }
    // return Math.random() > (1 - probability)
    game.seed += 1;
    return random(game.seed) > (1 - probability);
}
function levelToProbability(level) {
    return level * .25;
}
function makeAlly() {
    return {
        hero: {
            name: "Rudolf",
            defence: 4,
            attack: 5,
            lucky: .75,
            morale: 0,
            spell: 4,
        },
        skills: [
            { type: "tactic", level: 0 },
            { type: "earth", level: 3 },
            { type: "machine", level: 1 },
            { type: "air", level: 3 },
        ],
        army: [
            stackOf("archer", 10),
            stackOf("dragon", 1),
        ],
        spells: [
            "forgetfulness",
        ],
    };
}
function makeFoe() {
    return {
        hero: {
            name: "Henry",
            defence: 3,
            attack: 6,
            lucky: .25,
            morale: 0,
            spell: 1,
        },
        army: [
            stackOf("archer", 15),
            stackOf("dragon", 14),
        ],
        skills: [],
        spells: ["arrow", "slow"],
    };
}
// endregion
// region grid
const forceFieldImage = imageOf("forceField");
const forceFieldAppearance = { image: forceFieldImage, width: 61, height: 136, count: 4 };
const forceFieldExists = { image: forceFieldImage, width: 61, height: 136, countOffset: 3, count: 9 };
const forceFieldDisappearance = { image: forceFieldImage, width: 61, height: 136, countOffset: 11, count: 4 };
const forceFieldDuration = 60;
const hastSprite = { image: imageOf("hast"), width: 113, height: 106, count: 15 };
const hypnotizeSprite = { image: imageOf("hypnotize"), width: 99, height: 90, count: 19 };
const antiMagicSprite = { image: imageOf("antiMagic"), width: 94, height: 126, count: 16 };
const forgetfulnessSprite = { image: imageOf("forgetfulness"), width: 119, height: 75, count: 15 };
const moraleSprite = { image: imageOf("morale"), width: 94, height: 127, count: 18 };
const slowSprite = { image: imageOf("slow"), width: 74, height: 54, count: 20 };
const angelSprite = { image: imageOf("angel"), width: 100, height: 110, count: 2, gap: 50 };
const dragonSprite = { image: imageOf("dragon"), width: 177, height: 110, count: 4, gap: 50 };
const dendroidSprite = { image: imageOf("dendroid"), width: 90, height: 115, count: 2, gap: 60, offset: 175 };
const archerSprite = { image: imageOf("archer"), width: 70, height: 85, count: 6, gap: 33, offset: 110 };
const ballistaSprite = { image: imageOf("ballista"), width: 135, height: 110, count: 1 };
const blessSprite = { image: imageOf("bless"), width: 43, height: 123, count: 20 };
const shieldSprite = { image: imageOf("shield"), width: 56, height: 73, count: 16 };
const frostRingSprite = { image: imageOf("frostRing"), width: 135, height: 130, count: 15 };
const aidTentSprite = { image: imageOf("firstAidTent"), width: 100, height: 130, count: 6, gap: 16 };
const resistanceSprite = { image: imageOf("resistance"), width: 91, height: 85, count: 20 };
const fireWallAppearSprite = { image: imageOf("fireWallAppear"), width: 44, height: 132, count: 8 };
const fireWallSprite = { image: imageOf("fireWall"), width: 44, height: 132, count: 9 };
const fireWallDisappearSprite = { image: imageOf("fireWallDisappear"), width: 44, height: 132, count: 6 };
const fireWallDuration = 60;
const backgroundImage = imageOf("background");
const fps = querySelector(".fps");
const queueCanvas = querySelector("canvas.queue");
const queueCtx = queueCanvas.getContext("2d");
const hexesCanvas = querySelector("canvas.hexes");
const backgroundContext = querySelector("canvas.background").getContext("2d");
const defenceBtn = querySelector("button.defence");
defenceBtn.addEventListener("click", defence);
const attackTypeBtn = querySelector("button.attack-type");
const waitedBtn = querySelector("button.wait");
waitedBtn.addEventListener("click", () => {
    wait();
});
const endTacticBtn = querySelector("button.end-tactic");
endTacticBtn.addEventListener("click", () => {
    endTacticBtn.style.display = "none";
    nextStackBtn.style.display = "none";
    bookBtn.disabled = true;
    defenceBtn.disabled = true;
    waitedBtn.disabled = true;
    game = initializedGame();
    nextRound();
});
const nextStackBtn = querySelector("button.next-stack");
nextStackBtn.addEventListener("click", nextTurn);
const bookBtn = querySelector("button.book-btn");
bookBtn.addEventListener("click", () => {
    openBook();
});
const availableHover = querySelector("canvas.available-hover").getContext("2d");
const endedContext = querySelector("canvas.ended").getContext("2d");
const book = querySelector(".book");
book.addEventListener("click", e => {
    e.stopPropagation();
});
const animations = querySelector("canvas.animations").getContext("2d");
const hexesContext = hexesCanvas.getContext("2d");
const battlefield = querySelector(".battlefield");
const availableCanvas = querySelector("canvas.available-hexes");
const deadUnits = querySelector("canvas.dead-unites").getContext("2d");
const availableHexes = availableCanvas.getContext("2d");
const unitsCanvas = querySelector("canvas.units");
const units = unitsCanvas.getContext("2d");
const defaultSeed = 16;
let game = initializedGame();
(() => {
    const allyLevel = ally().skills.find(i => i.type === "tactic")?.level || 0;
    const foeLevel = foe().skills.find(i => i.type === "tactic")?.level || 0;
    if (allyLevel === foeLevel) {
        return;
    }
    endTacticBtn.style.display = "initial";
    nextStackBtn.style.display = "initial";
    bookBtn.disabled = true;
    defenceBtn.disabled = true;
    waitedBtn.disabled = true;
    game = {
        ...game,
        type: "tactic",
        side: allyLevel > foeLevel ? ally() : foe(),
        level: Math.abs(allyLevel - foeLevel),
    };
})();
let hexes = [];
let hexesOfDead = [];
const lastRowIndex = 10;
const lastColumnIndex = 14;
const grid = [];
for (let i = 0; i <= lastRowIndex; i++) {
    const row = [];
    grid.push(row);
    for (let j = 0; j <= lastColumnIndex; j++) {
        row.push(j);
    }
}
// place army
hexes.push({ type: "stack", row: 0, column: 0, stack: ally().army[0] });
hexes.push({ type: "stack", row: 4, column: 1, stack: ally().army[1] });
hexes.push({ type: "stack", row: 5, column: 1, stack: foe().army[0] });
hexes.push({ type: "stack", row: 5, column: 4, stack: foe().army[1] });
// grid[2][3] = {
//   "type": "fireWall",
//   "state": "fires",
//   "animation": {
//     "duration": 60,
//     "frameCount": 6,
//     "frame": 0,
//     "timer": 0,
//     "runout": false
//   }
// }
// endregion
function effectIn(stack, type) {
    if (!stack) {
        return;
    }
    for (let effect of toRealStack(stack).effects) {
        if (type === effect.type) {
            return effect;
        }
    }
}
function skillIn(side, type) {
    if (!side) {
        return;
    }
    for (let effect of side.skills) {
        if (type === effect.type) {
            return effect;
        }
    }
}
function unitKind(stack) {
    const type = stack.type;
    switch (type) {
        case "ballista":
            return "machine";
        case "aidTent":
            return "machine";
        case "zombie":
            return "undead";
        case "vampire":
            return "undead";
        case "griffin":
            return "alive";
        case "pikeman":
            return "alive";
        case "archer":
            return "alive";
        case "enhancedArcher":
            return "alive";
        case "gargoyle":
            return "stone";
        case "dragon":
            return "alive";
        case "dendroid":
            return "alive";
        case "angel":
            return "alive";
        case "devil":
            return "alive";
        case "clone":
            return unitKind(stack.copy);
        default:
            never(type);
    }
}
function emptyHex(row, column) {
    return { type: "empty", row, column };
}
function fireWallHex(position) {
    return {
        ...position,
        type: "fireWall",
        state: "appearing",
        animation: { duration: fireWallDuration, frameCount: fireWallAppearSprite.count, frame: 0 }
    };
}
function stackHex(stack, row, column) {
    return { type: "stack", stack, row, column };
}
function positionOf(stack) {
    for (let hex of hexes) {
        if (stackFromHex(hex) === stack) {
            return hex;
        }
    }
    return { row: -1, column: -1 };
}
function isEvenRow(row) {
    return row % 2 === 1;
}
function stackHexFor({ excludes, attacker }) {
    return stackHexForPosition({ excludes, position: positionOf(attacker) });
}
function stackHexForPosition({ position: { row, column }, excludes }) {
    if (row === -1) {
        return [];
    }
    const targets = [];
    for (let [nColumn, nRow] of directions[isEvenRow(row) ? "even" : "odd"]) {
        const newRow = row + nRow;
        const newColumn = column + nColumn;
        const hex = hexAtRowColumn(newRow, newColumn);
        if (!hex) {
            continue;
        }
        const stack = stackFromHex(hex);
        if (stack && !excludes.includes(stack)) {
            targets.push({ stack, row: newRow, column: newColumn, type: "attackable" });
        }
    }
    return targets;
}
const directions = {
    even: [
        // [column, row]
        [-1, 0], // 3 = W
        [-1, -1], // 2 = NW
        [0, -1], // 1 = NE
        [1, 0], // 0 = E
        [0, 1], // 5 = SE
        [-1, 1], // 4 = SW
    ],
    odd: [
        [-1, 0], // 3 = W
        [0, -1], // 2 = NW
        [1, -1], // 1 = NE
        [1, 0], // 0 = E
        [1, 1], // 5 = SE
        [0, 1], // 4 = SW
    ]
};
function canStepOn(type) {
    return type === "empty" || type === "fireWall";
}
function availableHexPositionsFrom(args) {
    if (game.type === "tactic") {
        const res = [];
        if (game.side === ally()) {
            for (let row = 0; row <= lastRowIndex; row++) {
                for (let column = 0; column < (2 + game.level); column++) {
                    if (!canStepOn(hexAtRowColumn(row, column)?.type)) {
                        continue;
                    }
                    res.push({ column, row });
                }
            }
            return res;
        }
        for (let row = 0; row <= lastRowIndex; row++) {
            for (let column = lastColumnIndex; column > (lastColumnIndex - 2 - game.level); column--) {
                if (!canStepOn(hexAtRowColumn(row, column)?.type)) {
                    continue;
                }
                res.push({ column, row });
            }
        }
        return res;
    }
    const { row, column, radius, withObstacles = true, type = "stepOn" } = args;
    const enemies = currentEnemies();
    function canAttack(stack) {
        return enemies.includes(stack);
    }
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const queue = [{ column, row, dist: 0 }];
    visited[row][column] = true;
    const hexes = [];
    function push(args) {
        hexes.push(args);
    }
    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) {
            continue;
        }
        const { column, row, dist } = item;
        if (radius === 0 && type !== "stepOn") {
            const hex = hexAt(item);
            const stack = stackFromHex(hex);
            if (!hex || !stack) {
                return [];
            }
            return stackHexFor({ excludes: stackOwner(stack).army, attacker: stack });
        }
        if (dist >= radius)
            continue;
        for (const [dx, dy] of directions[isEvenRow(row) ? "even" : "odd"]) {
            const nColumn = column + dx;
            const nRow = row + dy;
            if (nColumn < 0 || nRow < 0 || nColumn >= cols || nRow >= rows)
                continue;
            if (visited[nRow][nColumn])
                continue;
            const hex = hexAtRowColumn(nRow, nColumn);
            const hexType = hex?.type;
            const stack = stackFromHex(hex);
            if (type === "stepOn" && withObstacles && !canStepOn(hexType) ||
                (type === "attackOn" || type === "moveToAttack") && withObstacles && !canStepOn(hexType) && !stack ||
                stackWidth(selected()) === 2 && (!canStepOn(hexAtRowColumn(nRow, nColumn + 1)?.type) &&
                    !canStepOn(hexAtRowColumn(nRow, nColumn - 1)?.type))) {
                continue;
            }
            visited[nRow][nColumn] = true;
            const nextDist = dist + 1;
            const differentPosition = nColumn !== column || nRow !== row;
            const canStepOrAttack = (!stack || canAttack(stack));
            if (differentPosition && type === "stepOn" && canStepOrAttack) {
                const hexTypeLabel = stack && canAttack(stack) ? "attackable" : undefined;
                push({ column: nColumn, row: nRow, type: hexTypeLabel });
            }
            if (differentPosition && (type === "moveToAttack" && canStepOrAttack ||
                type === "attackOn" && stack && canAttack(stack))) {
                const hexTypeLabel = stack && canAttack(stack) ? "attackable" : undefined;
                push({ column: nColumn, row: nRow, type: hexTypeLabel });
            }
            if ((type === "moveToAttack" || type === "attackOn") &&
                !(nextDist < radius) &&
                nextDist === radius &&
                !stack) {
                for (const [dx, dy] of directions[isEvenRow(nRow) ? "even" : "odd"]) {
                    const attackColumn = nColumn + dx;
                    const attackRow = nRow + dy;
                    const hex = hexAtRowColumn(attackRow, attackColumn);
                    const stack = hex && stackFromHex(hex);
                    if (visited[attackRow]?.[attackColumn]) {
                        continue;
                    }
                    if (stack && canAttack(stack)) {
                        if (visited[attackRow]) {
                            visited[attackRow][attackColumn] = true;
                        }
                        push({ column: attackColumn, row: attackRow, type: "attackable" });
                    }
                }
            }
            if (nextDist < radius && (type === "stepOn" ||
                type === "moveToAttack" && !stack ||
                type === "attackOn" && !stack)) {
                queue.push({ column: nColumn, row: nRow, dist: nextDist });
            }
        }
    }
    return hexes;
}
function canFireTwice(stack) {
    if (effectIn(stack, "forgetfulness")) {
        return false;
    }
    const type = stack.type;
    switch (type) {
        case "enhancedArcher":
            return true;
        case "gargoyle":
        case "ballista":
        case "archer":
        case "griffin":
        case "vampire":
        case "zombie":
        case "dragon":
        case "dendroid":
        case "pikeman":
        case "angel":
        case "devil":
        case "aidTent":
            return false;
        case "clone":
            return canFireTwice(stack.copy);
        default:
            never(type);
    }
}
function canFire(stack) {
    if (effectIn(stack, "forgetfulness")) {
        return false;
    }
    const type = stack.type;
    switch (type) {
        case "ballista":
        case "archer":
        case "enhancedArcher":
            return true;
        case "gargoyle":
        case "griffin":
        case "vampire":
        case "zombie":
        case "dragon":
        case "dendroid":
        case "pikeman":
        case "angel":
        case "devil":
        case "aidTent":
            return false;
        case "clone":
            return canFire(stack.copy);
        default:
            never(type);
    }
}
function currentEnemies() {
    return stackEnemy(selected()).army;
}
function isPointInTriangle(p, a, b, point) {
    const v0 = { x: point.x - a.x, y: point.y - a.y };
    const v1 = { x: b.x - a.x, y: b.y - a.y };
    const v2 = { x: p.x - a.x, y: p.y - a.y };
    const dot00 = v0.x * v0.x + v0.y * v0.y;
    const dot01 = v0.x * v1.x + v0.y * v1.y;
    const dot02 = v0.x * v2.x + v0.y * v2.y;
    const dot11 = v1.x * v1.x + v1.y * v1.y;
    const dot12 = v1.x * v2.x + v1.y * v2.y;
    const denominator = dot00 * dot11 - dot01 * dot01;
    if (denominator === 0)
        return false;
    const u = (dot11 * dot02 - dot01 * dot12) / denominator;
    const v = (dot00 * dot12 - dot01 * dot02) / denominator;
    return u >= 0 && v >= 0 && u + v <= 1;
}
function getCenter(vertices) {
    const sum = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }));
    return { x: sum.x / vertices.length, y: sum.y / vertices.length };
}
// region document selection
function querySelector(target) {
    const item = document.querySelector(target);
    if (!item) {
        throw new Error("Fuck");
    }
    return item;
}
let horizontalIndent = 125;
let verticalIndent = 160;
function imageOf(name) {
    const image = new Image();
    image.src = `/img/${name}.png`;
    return image;
}
function updateAttackBtn() {
    if (currentAttackType() === "hand") {
        attackTypeBtn.innerText = "Hand attack";
    }
    else {
        attackTypeBtn.innerText = "Fire attack";
    }
}
attackTypeBtn.addEventListener("click", () => {
    if (!canFire(selected())) {
        return;
    }
    const type = game.attackType;
    if (type.selected === "hand") {
        type.selected = "fire";
    }
    else {
        type.selected = "hand";
    }
    updateAttackBtn();
});
// endregion
const hexLineWidth = 2;
const hexSideLength = 43;
const triangleRightLine = hexSideLength / 2;
const hexHalfWidth = Math.sqrt(Math.pow(hexSideLength, 2) - Math.pow(triangleRightLine, 2));
const hexWidth = hexHalfWidth * 2;
const hexHeight = hexSideLength + triangleRightLine * 2;
function plotLineAtAngle(args) {
    args.ctx.beginPath();
    const res = drawLineAtAngle(args);
    args.ctx.stroke();
    return res;
}
function rowY(rowIndex) {
    return triangleRightLine + hexSideLength + (hexSideLength + triangleRightLine) * rowIndex + verticalIndent;
}
function rowCenterY(rowIndex) {
    return (hexSideLength + triangleRightLine) * rowIndex + hexSideLength + verticalIndent;
}
function columnHexX(rowIndex, columnIndex) {
    return (isEvenRow(rowIndex) ? 0 : hexHalfWidth) + hexWidth * columnIndex + horizontalIndent;
}
function clearRect(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
let startAngleDeg = 270;
function rowX(rowIndex, columnIndex) {
    return columnHexX(rowIndex, columnIndex) + hexLineWidth;
}
const pointInHex = 6;
const allHexes = [];
grid.forEach((row, rowIndex) => {
    let y = rowY(rowIndex);
    let angelDeg = startAngleDeg;
    allHexes.push([]);
    row.forEach((_, columnIndex) => {
        let x = rowX(rowIndex, columnIndex);
        allHexes[rowIndex].push([]);
        for (let i = 0; i < pointInHex; i++) {
            const end = plotLineAtAngle({
                ctx: hexesContext,
                x0: x,
                y0: y,
                angelDeg,
                // strokeStyle: styles[i]
            });
            allHexes[rowIndex][columnIndex].push({ x: x, y: y, index: i });
            x = end.x;
            y = end.y;
            angelDeg = (angelDeg + 60) % 360;
        }
    });
});
function positionToCoordinate(position) {
    const center = getCenter(allHexes[position.row][position.column]);
    return {
        x: center.x - hexHalfWidth,
        y: center.y + hexHeight / 4,
    };
}
const flingCoefficient = 20;
const walkingCoefficient = 7;
function normalizedPosition(targetCoordinate, currentCoordinate) {
    const xDiff = targetCoordinate.x - currentCoordinate.x;
    const yDiff = targetCoordinate.y - currentCoordinate.y;
    const coefficient = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    const normalizedX = (xDiff / coefficient);
    const normalizedY = (yDiff / coefficient);
    return { x: normalizedX, y: normalizedY };
}
function moveSelectedStack(action, target) {
    const previous = positionOf(selected());
    const hex = hexAt(previous);
    const _hex = stackHexFrom(hex);
    if (samePositions(previous, target) || !_hex) {
        return Promise.resolve();
    }
    const stackHex = _hex;
    const targetCoordinate = positionToCoordinate(target);
    const currentCoordinate = positionToCoordinate(previous);
    const { x, y } = normalizedPosition(targetCoordinate, currentCoordinate);
    const path = [];
    const items = pathBetween({ start: previous, end: target });
    for (let i = 1; i < items.length - 1; i++) {
        const item = getCenter(allHexes[items[i].row][items[i].column]);
        item.y += hexHeight / 4;
        path.push(item);
    }
    path.push(positionToCoordinate(items[items.length - 1]));
    stackHex.moving = {
        action,
        target: targetCoordinate,
        current: currentCoordinate,
        targetPosition: target,
        previousPosition: previous,
        path,
        xSpeed: x * flingCoefficient,
        ySpeed: y * flingCoefficient,
    };
    return new Promise(res => {
        async function animate() {
            await move(stackHex);
            if (!stackHex.moving) {
                return res();
            }
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    });
}
function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function isEmptyHex(clickedHex, direction) {
    return hexAt(addDirection(clickedHex, direction))?.type === "empty";
}
function hexAt(position) {
    return hexAtRowColumn(position.row, position.column);
}
function hexAtRowColumn(row, column) {
    if (row > lastRowIndex || column < 0) {
        return undefined;
    }
    for (let i = 0; i < hexes.length; i++) {
        const item = hexes[i];
        const type = item.type;
        switch (type) {
            case "stackFireWall":
                if (item.stackHex.row === row && item.stackHex.column === column) {
                    return item;
                }
                break;
            case "empty":
            case "obstacle":
            case "fireWall":
                if (item.row === row && item.column === column) {
                    return item;
                }
                break;
            case "stack":
                if (item.row === row && item.column === column || item.row === row && (item.column - stackWidth(item.stack) + 1) === column) {
                    return item;
                }
                break;
            default:
                never(type);
        }
    }
    return emptyHex(row, column);
}
function triangleClick(clickedHex, currentPosition) {
    const vertices = allHexes[clickedHex.row][clickedHex.column];
    const center = getCenter(vertices);
    for (let i = 0; i < pointInHex; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % pointInHex];
        if (!isPointInTriangle(clickedHex, a, b, center)) {
            continue;
        }
        const direction = directions[isEvenRow(clickedHex.row) ? "even" : "odd"];
        const result = direction[i];
        const target = addDirection(clickedHex, result);
        const hex = hexAt(target);
        if (!hex) {
            continue;
        }
        if (samePositions(currentPosition, target)) {
            return result;
        }
        if (hex.type === "empty") {
            return result;
        }
        const left = direction[(i + pointInHex - 1) % pointInHex];
        if (isPointInTriangle(clickedHex, a, midpoint(a, b), center) && isEmptyHex(clickedHex, left)) {
            return left;
        }
        const right = direction[(i + 1) % pointInHex];
        if (isPointInTriangle(clickedHex, midpoint(a, b), b, center) && isEmptyHex(clickedHex, right)) {
            return right;
        }
    }
    return null;
}
function closestHexPosition({ hexes, row, column }) {
    let closest = null;
    let minDistance = Infinity;
    hexes.forEach(hex => {
        const distance = Math.max(Math.abs(hex.row - row), Math.abs(hex.column - column));
        if (distance < minDistance) {
            minDistance = distance;
            closest = { row: hex.row, column: hex.column };
        }
    });
    if (!closest) {
        throw new Error("Can't find closest");
    }
    return closest;
}
function addDirection(position, direction) {
    return {
        row: position.row + direction[1],
        column: position.column + direction[0],
    };
}
function nextSelectedPosition(position) {
    const selectedPosition = positionOf(selected());
    if (effectIn(selected(), "freeze")) {
        return selectedPosition;
    }
    const newPosition = addDirection(position, triangleClick(position, selectedPosition) || [-1, 0]);
    if (newPosition.row > grid.length - 1 || newPosition.column > grid[0].length - 1) {
        return closestHexPosition({
            ...newPosition,
            hexes: availableHexPositionsFrom({ ...selectedPosition, radius: movementOf(selected()) })
        });
    }
    return newPosition;
}
// Action queue removed - using async/await instead
async function processActions(actions) {
    for (const action of actions) {
        await doAction(action);
    }
}
function selectedType() {
    return selected().type;
}
function onAnimationTick(animation, timestamp) {
    if (animation.runout) {
        return;
    }
    if (!animation.timer)
        animation.timer = timestamp;
    if (!animation.frame)
        animation.frame = 0;
    const delta = timestamp - animation.timer;
    if (delta >= animation.duration) {
        animation.frame = animation.frame + 1;
        animation.timer = timestamp;
    }
    if (animation.frame >= animation.frameCount) {
        animation.runout = true;
    }
}
function positionToPoint(position) {
    return {
        y: rowY(position.row) - hexHeight,
        x: rowX(position.row, position.column),
    };
}
function stackPoints(stacks) {
    return stacks.map(positionOf).map(positionToPoint);
}
function positionPointOf(stack) {
    switch (stack.type) {
        case "aidTent": {
            return stackOwner(stack) === ally() ? allyAidTentPosition : foeAidTentPosition;
        }
        case "ballista": {
            return stackOwner(stack) === ally() ? allyBallistaPosition : foeBallistaPosition;
        }
        default: {
            const position = positionOf(stack);
            return getCenter(allHexes[position.row][position.column]);
        }
    }
}
async function drawAnimation({ onFinished, struct, draw }) {
    inAnimation = true;
    return new Promise((resolve) => {
        function animate(timestamp) {
            clearRect(animations);
            onAnimationTick(struct, timestamp);
            if (struct.runout) {
                inAnimation = false;
                if (onFinished) {
                    Promise.resolve(onFinished()).then(() => resolve());
                }
                else {
                    resolve();
                }
                return;
            }
            draw();
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    });
}
function stackHexFrom(hex) {
    if (!hex) {
        return;
    }
    const type = hex.type;
    switch (type) {
        case "obstacle":
        case "empty":
        case "fireWall":
            return undefined;
        case "stack":
            return hex;
        case "stackFireWall":
            return hex.stackHex;
        default:
            never(type);
    }
}
function onTurnFinishing() {
    const stack = selected();
    if (game.morale.includes(stack) || !getLucky(levelToProbability(stackOwnerHero(stack).morale))) {
        ensureAdded(game.moved, stack);
        return { type: "nextTurn" };
    }
    ensureAdded(game.morale, stack);
    return { type: "morale", stack: stack };
}
function hasAntiMagic(stack) {
    return Boolean(stack && effectIn(toRealStack(stack), "antiMagic"));
}
async function doAction(action) {
    increaseSeed(1);
    switch (action.type) {
        case "spellSelected": {
            const spell = action.spell;
            if (spellLevel(spell) === 3) {
                switch (spell) {
                    case "lightning":
                    case "arrow":
                    case "frostRing":
                    case "clone":
                    case "fireWall":
                    case "forceField":
                    case "antiMagic":
                    case "hypnotize":
                        game = { ...game, type: "spelling", spell };
                        return;
                    case "forgetfulness":
                    case "slow": {
                        const caster = currentSide();
                        ensureAdded(game.heroesCastedSpell, caster.hero);
                        applyMagicEffect({ caster, spell, targets: stackEnemy(selected()).army });
                        return;
                    }
                    case "hast":
                    case "bless":
                    case "rage":
                    case "airShield": {
                        const caster = currentSide();
                        ensureAdded(game.heroesCastedSpell, caster.hero);
                        applyMagicEffect({ caster, spell, targets: caster.army });
                        return;
                    }
                    default:
                        never(spell);
                }
            }
            game = { ...game, type: "spelling", spell };
            return;
        }
        case "fireTwiceAt":
        case "fireAt": {
            const targetStack = stackAtPosition(action.hexPosition);
            if (!targetStack || !currentEnemies().includes(targetStack)) {
                await doAction(onTurnFinishing());
                return;
            }
            const attacker = positionPointOf(selected());
            const target = positionPointOf(targetStack);
            await new Promise((resolve) => {
                drawArrowAnimation(attacker, target, async () => {
                    const attackActions = singleAttack({
                        attacker: { hero: stackOwnerHero(selected()), stack: selected() },
                        defender: { hero: stackOwnerHero(targetStack), stack: targetStack },
                        type: "fire",
                    });
                    if (action.type === "fireAt") {
                        attackActions.push(onTurnFinishing());
                    }
                    else {
                        attackActions.push({ type: "fireAt", hexPosition: action.hexPosition });
                    }
                    for (const act of attackActions) {
                        await doAction(act);
                    }
                    resolve();
                });
            });
            return;
        }
        case "clickAt": {
            const clicked = action.targetPosition;
            const oldPosition = positionOf(selected());
            const available = availableHexPositionsFrom({
                row: oldPosition.row,
                column: oldPosition.column,
                radius: movementOf(selected()),
                type: "moveToAttack"
            });
            const target = available.find(c => samePositions(c, clicked));
            if (!target) {
                return;
            }
            if (selectedType() === "dendroid" && !samePositions(oldPosition, target)) {
                availableHexPositionsFrom({
                    ...oldPosition,
                    radius: 1,
                    type: "attackOn"
                }).forEach(i => {
                    const hex = hexAt(i);
                    const stack = stackFromHex(hex);
                    if (!stack) {
                        return;
                    }
                    const effect = effectIn(stack, "freeze");
                    if (!effect || effect.causer !== selected()) {
                        return;
                    }
                    removeFromArray(toRealStack(stack).effects, effect);
                });
            }
            const targetStack = stackAtPosition(action.targetPosition);
            if (targetStack && currentEnemies().includes(targetStack)) {
                if (!available.find(h => samePositions(h, action.nextSelectedPosition))) {
                    return;
                }
                const target = action.targetPosition;
                let next = action.nextSelectedPosition;
                if (stackWidth(selected()) === 2 && target.row === next.row && next.column > target.column) {
                    next = { ...next, column: next.column + 1 };
                }
                await doAction({ type: "moveTo", position: next });
                await doAction({ type: "closeAttack", targetStack });
                await doAction(onTurnFinishing());
                return;
            }
            await doAction({ type: "moveTo", position: action.targetPosition });
            await doAction(onTurnFinishing());
            return;
        }
        case "moveTo": {
            increaseSeed(action.position.row);
            increaseSeed(action.position.column);
            return await moveSelectedStack(action, { row: action.position.row, column: action.position.column });
        }
        case "hitBack": {
            const args = action.args;
            ensureAdded(game.defendedAttack, args.defender.stack);
            await processActions(directAttack({
                attacker: args.defender,
                defender: args.attacker,
                type: "hand",
            }));
            return;
        }
        case "closeAttack": {
            const args = {
                attacker: { hero: stackOwnerHero(selected()), stack: selected() },
                defender: { hero: stackEnemy(selected()).hero, stack: action.targetStack },
                type: "hand"
            };
            const result = directAttack(args);
            const attacker = args.attacker.stack;
            const defender = args.defender.stack;
            const first = result[0];
            if (attacker.type === "vampire" && unitKind(defender) === "alive" && (first?.type === "receiverDead" || first?.type === "receiveDamage")) {
                result.push({ type: "heal", stack: attacker, value: first.damage * .2 });
            }
            if (first?.type !== "receiverDead" && shouldGetHitBack(attacker) && canHitBack(defender)) {
                result.push({ type: "hitBack", args });
            }
            result.push(onTurnFinishing());
            await processActions(result);
            return;
        }
        case "flame": {
            await drawFlame(action);
            return;
        }
        case "morale": {
            const sprite = moraleSprite;
            const struct = { duration: 60, frameCount: sprite.count, frame: 0 };
            const position = positionToPoint(positionOf(action.stack));
            return drawAnimation({
                struct,
                draw() {
                    const xOffset = stackWidth(action.stack) === 2 ? -hexHalfWidth : 0;
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x + xOffset, position.y - hexHeight / 4, hexWidth, hexHeight);
                }
            });
        }
        case "receiveDamage": {
            return;
        }
        case "receiverDead": {
            const dead = action.receiver;
            if (unitKind(dead) === "machine") {
                return;
            }
            const position = positionOf(dead);
            const army = stackOwner(dead).army;
            removeFromArray(army, dead);
            const index = hexes.findIndex(i => stackFromHex(i) === dead);
            if (index === -1) {
                return;
            }
            hexes.splice(index, 1);
            hexesOfDead.push({ ...position, stack: dead });
            return;
        }
        case "nextTurn": {
            nextTurn();
            return;
        }
        case "stopped": {
            const position = positionOf(action.receiver);
            if (position.row === -1) {
                return;
            }
            const hex = hexAt(position);
            const stackHex = stackHexFrom(hex);
            if (!stackHex || !hex) {
                return;
            }
            stackHex.freezing = { action, diff: 0, startMs: Date.now(), total: 0 };
            const args = { hex, ...position };
            const animate = () => {
                if (!stackHex.freezing) {
                    return;
                }
                animateFreeze(args);
                requestAnimationFrame(animate);
            };
            animate();
            return;
        }
        case "tryHealAndNextTurn": {
            ensureAdded(game.moved, selected());
            const stack = stackAtPosition(action.stackPosition);
            if (!stack) {
                return await doAction({ type: "nextTurn" });
            }
            await doAction({ stack, value: action.value, type: "heal" });
            await doAction({ type: "nextTurn" });
            return;
        }
        case "heal": {
            // add animation
            heal(action);
            return;
        }
        case "resistance": {
            const sprite = resistanceSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            return drawAnimation({
                struct,
                draw() {
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, action.stackPoint.x, action.stackPoint.y - sprite.height * .75, hexWidth, hexHeight);
                }
            });
        }
        case "reflect":
        case "empty": {
            return;
        }
        case "rage":
            return;
        case "bless": {
            const sprite = blessSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const positions = stackPoints(action.targets);
            return drawAnimation({
                struct,
                draw() {
                    positions.forEach(position => {
                        animations.drawImage(sprite.image, 
                        // xOffset + frame * xOffset + frame * frameWidth,
                        struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x + sprite.width / 2, position.y, sprite.width, sprite.height);
                    });
                }
            });
        }
        case "slow": {
            const sprite = slowSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const positions = stackPoints(action.targets);
            return drawAnimation({
                struct,
                draw() {
                    positions.forEach(position => {
                        animations.drawImage(sprite.image, 
                        // xOffset + frame * xOffset + frame * frameWidth,
                        struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x, position.y + hexHeight / 2, sprite.width, sprite.height);
                    });
                }
            });
        }
        case "frostRing": {
            const sprite = frostRingSprite;
            const { point } = action;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            return drawAnimation({
                struct,
                onFinished: async () => {
                    const actions = stackHexForPosition({ position: point, excludes: [] }).flatMap(i => {
                        return magicAttack({
                            attacker: currentSide(),
                            receiver: stackOwner(i.stack),
                            target: i.stack,
                            spell: "frostRing",
                        });
                    });
                    await processActions(actions);
                },
                draw() {
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, point.x - hexWidth / 2 + hexLineWidth * 2, point.y, sprite.width, sprite.height);
                }
            });
        }
        case "hast": {
            const sprite = hastSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const positions = stackPoints(action.targets);
            return drawAnimation({
                struct,
                draw() {
                    positions.forEach(position => {
                        animations.drawImage(sprite.image, 
                        // xOffset + frame * xOffset + frame * frameWidth,
                        struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x, position.y, hexWidth, hexHeight);
                    });
                }
            });
        }
        case "clone": {
            const position = positionOf(action.target);
            let available;
            for (let column = position.column; column < grid[position.row].length; column++) {
                if (canStepOn(hexAtRowColumn(position.row, column)?.type)) {
                    available = { row: position.row, column };
                    break;
                }
            }
            if (!available) {
                return;
            }
            const hex = hexAt(available);
            if (!hex) {
                return;
            }
            const type = hex.type;
            const clone = makeClone(action.target);
            currentSide().army.push(clone);
            switch (type) {
                case "obstacle":
                case "stackFireWall":
                case "stack":
                    return;
                case "empty":
                    hexes.push(stackHex(clone, available.row, available.column));
                    return;
                case "fireWall":
                    hexes.push({
                        row: hex.row,
                        column: hex.column,
                        type: "stackFireWall",
                        fireWall: hex,
                        stackHex: stackHex(clone, available.row, available.column)
                    });
                    return;
                default:
                    never(type);
            }
            break;
        }
        case "airShield": {
            const sprite = shieldSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const positions = stackPoints(action.targets);
            return drawAnimation({
                struct,
                draw() {
                    positions.forEach(position => {
                        animations.drawImage(sprite.image, 
                        // xOffset + frame * xOffset + frame * frameWidth,
                        struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x, position.y, hexWidth, hexHeight);
                    });
                }
            });
        }
        case "spelling": {
            const { spell, position } = action;
            const stack = stackAtPosition(position);
            if (hasAntiMagic(stack)) {
                return;
            }
            switch (spell) {
                case "frostRing":
                    await doAction({ type: "frostRing", point: { ...position, ...positionToPoint(position) } });
                    break;
                case "lightning":
                case "arrow": {
                    const { enemy, target } = enemyStackAt(position);
                    if (!target) {
                        return;
                    }
                    await processActions(magicAttack({
                        receiver: enemy,
                        attacker: currentSide(),
                        target,
                        spell,
                    }));
                    break;
                }
                case "forgetfulness":
                case "slow": {
                    const { target } = enemyStackAt(position);
                    if (!target) {
                        return;
                    }
                    await processActions([applyMagicEffect({
                            targets: [target],
                            spell,
                            caster: currentSide(),
                        })]);
                    break;
                }
                case "hast":
                case "bless":
                case "rage":
                case "clone":
                case "antiMagic":
                case "airShield": {
                    const { target } = friendStackAt(position);
                    if (!target) {
                        return;
                    }
                    await processActions([applyMagicEffect({
                            targets: [target],
                            spell,
                            caster: currentSide(),
                        })]);
                    break;
                }
                case "fireWall":
                    if (hexAt(position)?.type !== "empty") {
                        return;
                    }
                    hexes.push(fireWallHex(position));
                    break;
                case "forceField":
                    if (hexAt(position)?.type !== "empty") {
                        return;
                    }
                    hexes.push({
                        ...position,
                        type: "obstacle",
                        kind: {
                            type: "forceField",
                            state: "appearing",
                            animation: { duration: forceFieldDuration, frameCount: forceFieldAppearance.count, frame: 0 },
                        },
                    });
                    break;
                case "hypnotize":
                    const stack = enemyStackAt(action.position)?.target;
                    if (!stack || stack.type === "clone") {
                        return;
                    }
                    await doAction(applyMagicEffect({ targets: [stack], spell: "hypnotize", caster: currentSide() }));
                    break;
                default:
                    never(spell);
            }
            drawCeilHover(undefined);
            game = { ...game, type: "battle" };
            ensureAdded(game.heroesCastedSpell, stackOwnerHero(selected()));
            break;
        }
        case "select": {
            const stack = stackAtPosition(action.stackPosition);
            if (!stack) {
                return;
            }
            game.selected = stack;
            return;
        }
        case "cloneAttacked": {
            const stack = action.stack;
            const army = stackOwner(stack).army;
            removeFromArray(army, stack);
            const index = hexes.findIndex(i => stackFromHex(i) === stack);
            if (index === -1) {
                return;
            }
            hexes.splice(index, 1);
            return;
        }
        case "hypnotize": {
            const sprite = hypnotizeSprite;
            const struct = { duration: 60, frameCount: sprite.count, frame: 0 };
            const position = positionToPoint(positionOf(action.target));
            return drawAnimation({
                struct,
                draw() {
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x, position.y, hexWidth, hexHeight);
                }
            });
        }
        case "antiMagic": {
            const sprite = antiMagicSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const position = positionToPoint(positionOf(action.target));
            const heightDiff = hexHeight * .3;
            const widthDiff = hexWidth * .3;
            return drawAnimation({
                struct,
                draw() {
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x - widthDiff / 2, position.y - heightDiff / 2, hexWidth + widthDiff, hexHeight + heightDiff);
                }
            });
        }
        case "forgetfulness": {
            const sprite = forgetfulnessSprite;
            const struct = { duration: 40, frameCount: sprite.count, frame: 0 };
            const position = positionToPoint(positionOf(action.target));
            const heightDiff = hexHeight * .6;
            const widthDiff = hexWidth * .6;
            return drawAnimation({
                struct,
                draw() {
                    animations.drawImage(sprite.image, 
                    // xOffset + frame * xOffset + frame * frameWidth,
                    struct.frame * sprite.width, 0, sprite.width, sprite.height, position.x - widthDiff / 2, position.y - heightDiff / 2, hexWidth + widthDiff, hexHeight + heightDiff);
                }
            });
        }
        default: {
            never(action);
        }
    }
}
function stackAtPosition(position) {
    const hex = hexAt(position);
    if (!hex) {
        return;
    }
    const stack = stackFromHex(hex);
    if (!stack) {
        return;
    }
    return stack;
}
function hexAtPoint(point) {
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex];
        for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
            const hex = hexAtRowColumn(rowIndex, columnIndex);
            const vertex = allHexes[rowIndex][columnIndex];
            const center = getCenter(vertex);
            let inside = false;
            for (let i = 0; i < pointInHex; i++) {
                const a = vertex[i];
                const b = vertex[(i + 1) % pointInHex];
                if (isPointInTriangle(point, a, b, center)) {
                    inside = true;
                    break;
                }
            }
            if (inside) {
                if (!hex) {
                    return;
                }
                return { hex, row: rowIndex, column: columnIndex, ...point };
            }
        }
    }
    return;
}
// region draw
function drawQueue() {
    clearRect(queueCtx);
    const queue = gameQueue();
    const boxWidth = 60;
    const boxHeight = 40;
    const padding = 10;
    const totalWidth = boxWidth + padding;
    const last = Math.ceil(queueCanvas.width / totalWidth);
    const indent = (queueCanvas.width - Math.min(Math.floor(queueCanvas.width / totalWidth), queue.length) * totalWidth) / 2;
    queue.slice(0, last).forEach((stack, index) => {
        const x = indent + index * totalWidth;
        const y = 5;
        // Draw box
        if (stackOwner(stack) === ally()) {
            queueCtx.fillStyle = "green";
        }
        else {
            queueCtx.fillStyle = "blue";
        }
        queueCtx.fillRect(x, y, boxWidth, boxHeight);
        // Draw stack type
        queueCtx.fillStyle = "#000";
        queueCtx.font = "12px Arial";
        queueCtx.textAlign = "center";
        queueCtx.textBaseline = "middle";
        queueCtx.fillText(stack.type, x + boxWidth / 2, y + boxHeight / 3);
        queueCtx.fillText(String(toRealStack(stack).count), x + boxWidth / 2, y + (boxHeight * 2) / 3);
    });
}
function drawCeilHover(hex) {
    clearRect(availableHover);
    if (!hex) {
        return;
    }
    let angelDeg = startAngleDeg;
    let y = rowY(hex.row);
    let x = rowX(hex.row, hex.column);
    availableHover.beginPath();
    for (let i = 0; i < pointInHex; i++) {
        const end = drawLineAtAngle({
            ctx: availableHover,
            x0: x,
            y0: y,
            angelDeg,
            movePrevious: false,
        });
        x = end.x;
        y = end.y;
        angelDeg = (angelDeg + 60) % 360;
    }
    availableHover.closePath();
    availableHover.fillStyle = "rgba(0, 0, 255, 0.3)";
    availableHover.fill();
}
class Flame {
    start;
    end;
    size = 1;
    life = 0;
    ttl = 500;
    hue = 35 + Math.random() * 15;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    update() {
        this.start.x += (this.end.x - this.start.x) * this.life / this.ttl;
        this.start.y += (this.end.y - this.start.y) * this.life / this.ttl;
        this.life++;
        this.size *= 0.97;
        return this.life < this.ttl;
    }
    draw(ctx) {
        const a = 1 - this.life / this.ttl;
        const g = ctx.createRadialGradient(this.start.x, this.start.y, 0, this.end.x, this.end.y, 10);
        g.addColorStop(0, `hsla(${this.hue},100%,70%,${a})`);
        g.addColorStop(0.5, `hsla(${this.hue - 20},100%,50%,${a * 0.8})`);
        g.addColorStop(1, `rgba(0, 0, 0, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.start.x, this.start.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}
async function drawFlame(action) {
    clearRect(animations);
    inAnimation = true;
    const start = {
        y: rowCenterY(action.from.row),
        x: rowX(action.from.row, action.from.column),
    };
    // const start = {
    //   y: rowCenterY(action.from.row) - hexHeight * 3 / 8,
    //   x: rowX(action.from.row, action.from.column) + hexWidth * 3 / 4
    // }
    const end = { y: rowCenterY(action.to.row), x: rowX(action.to.row, action.to.column) };
    // const end = {y: rowCenterY(action.to.row) - hexHeight * 3 / 8, x: rowX(action.to.row, action.to.column) + hexWidth * 3 / 4}
    const xDiff = hexHalfWidth;
    const yDiff = 0;
    const flame = new Flame({ x: start.x + xDiff, y: start.y + yDiff }, { x: end.x + xDiff, y: end.y + yDiff });
    const startMs = Date.now();
    return new Promise((resolve) => {
        function loop() {
            if (Date.now() - startMs > flame.ttl + 1000) {
                clearRect(animations);
                inAnimation = false;
                resolve();
                return;
            } // fewer emitted
            if (!flame.update()) {
                requestAnimationFrame(loop);
                return;
            }
            flame.draw(animations);
            requestAnimationFrame(loop);
        }
        loop();
    });
}
function drawLineAtAngle({ ctx, x0, y0, angelDeg, strokeStyle = "#628103", lineWidth = hexLineWidth, lineJoin = "round", lineCap = "round", movePrevious = true, length = hexSideLength, }) {
    const angelRad = angelDeg * Math.PI / 180;
    const x1 = x0 + length * Math.cos(angelRad);
    const y1 = y0 + length * Math.sin(angelRad);
    movePrevious && ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = lineJoin;
    ctx.lineCap = lineCap;
    return { x: x1, y: y1 };
}
function drawText({ ctx, text, font = "20px Arial", x, y, fillStyle = "#000", strokeStyle = "", lineWidth = 0 }) {
    ctx.font = font;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = lineWidth;
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.strokeText(String(text), x, y);
    }
    else {
        ctx.fillText(String(text), x, y);
    }
}
function pathBetween({ start, end }) {
    const key = (r, c) => `${r},${c}`;
    const heuristic = (a, b) => {
        return Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
    };
    const open = [start];
    const cameFrom = new Map();
    const gScore = new Map([[key(start.row, start.column), 0]]);
    const fScore = new Map([[key(start.row, start.column), heuristic(start, end)]]);
    while (open.length > 0) {
        let current = open.reduce((best, cell) => fScore.get(key(cell.row, cell.column)) < fScore.get(key(best.row, best.column)) ? cell : best);
        if (samePositions(current, end)) {
            const path = [];
            while (current) {
                path.unshift(current);
                current = cameFrom.get(key(current.row, current.column));
            }
            return path;
        }
        open.splice(open.indexOf(current), 1);
        const neighbors = directions[isEvenRow(current.row) ? "even" : "odd"]
            .map(([column, row]) => ({ row: current.row + row, column: current.column + column }))
            .filter(n => {
            const type = hexAt(n)?.type;
            return n.row >= 0 &&
                n.row <= lastRowIndex &&
                n.column >= 0 &&
                n.column <= lastColumnIndex && (type === "empty" ||
                type === "fireWall");
        });
        for (const neighbor of neighbors) {
            const tentativeG = gScore.get(key(current.row, current.column)) + 1;
            const nKey = key(neighbor.row, neighbor.column);
            if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                cameFrom.set(nKey, current);
                gScore.set(nKey, tentativeG);
                fScore.set(nKey, tentativeG + heuristic(neighbor, end));
                if (!open.some(o => o.row === neighbor.row && o.column === neighbor.column)) {
                    open.push(neighbor);
                }
            }
        }
    }
    return [];
}
function nearlyEqual(a, b, epsilon = flingCoefficient / 2) {
    return Math.abs(a - b) <= epsilon;
}
function forceMove(hex) {
    const stackHex = stackHexFrom(hex);
    if (!stackHex || !stackHex.moving) {
        return;
    }
    const targetPosition = stackHex.moving.targetPosition;
    const index = hexes.findIndex(i => i === hex);
    if (index === -1) {
        return;
    }
    hexes.splice(index, 1);
    const old = hexAt(targetPosition);
    if (!old) {
        return;
    }
    stackHex.moving = undefined;
    if (old.type === "fireWall") {
        hexes.push({ type: "stackFireWall", stackHex, fireWall: old, ...targetPosition });
    }
    else {
        hexes.push({ ...stackHex, ...targetPosition });
    }
}
const freezingTime = 1000;
const lineCount = 5;
function animateFreeze({ hex, row, column }) {
    const stackHex = stackHexFrom(hex);
    if (!stackHex) {
        return;
    }
    const freeze = stackHex.freezing;
    if (!freeze) {
        return inAnimation = false;
    }
    inAnimation = true;
    if (freeze.total >= freezingTime) {
        clearRect(animations);
        stackHex.freezing = undefined;
        inAnimation = false;
        return;
    }
    const diff = Date.now() - freeze.total - freeze.startMs;
    freeze.diff += diff;
    freeze.total += diff;
    if (freeze.diff < 50) {
        return;
    }
    freeze.diff = 0;
    const lineLength = (freeze.total / freezingTime) * (hexSideLength * 1.5);
    const offset = hexWidth / (lineCount + 1);
    for (let i = 0; i < lineCount; i++) {
        const args = {
            ctx: animations,
            x0: rowX(row, column) + offset * (i + 1),
            y0: rowY(row) - hexHeight / 2,
            length: lineLength,
            angelDeg: 90,
            strokeStyle: "#6a6ded",
        };
        plotLineAtAngle(args);
    }
}
function drawArrowAnimation(from, to, onComplete) {
    inAnimation = true;
    clearRect(animations);
    const startTime = Date.now();
    const duration = 600; // Faster animation for archer arrow
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Clear previous frame
        clearRect(animations);
        // Calculate current arrow position
        const currentX = from.x + (to.x - from.x) * progress;
        const currentY = from.y + (to.y - from.y) * progress;
        // Calculate arrow direction and length
        const angel = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 20;
        const shaftLength = arrowLength * 0.7;
        // Draw arrow shaft (wooden part)
        animations.beginPath();
        animations.strokeStyle = "#8B4513"; // Brown wooden shaft
        animations.lineWidth = 4;
        animations.lineCap = "round";
        animations.moveTo(currentX - shaftLength * Math.cos(angel), currentY - shaftLength * Math.sin(angel));
        animations.lineTo(currentX, currentY);
        animations.stroke();
        const size = 6;
        const angle = Math.PI / 4; // 45 degrees
        const backX = currentX - shaftLength * Math.cos(angel);
        const backY = currentY - shaftLength * Math.sin(angel);
        animations.beginPath();
        animations.strokeStyle = "#654321"; // Darker brown for feathers
        animations.lineWidth = 2;
        animations.moveTo(backX, backY);
        animations.lineTo(backX - size * Math.cos(angel + angle), backY - size * Math.sin(angel + angle));
        animations.moveTo(backX, backY);
        animations.lineTo(backX - size * Math.cos(angel - angle), backY - size * Math.sin(angel - angle));
        animations.stroke();
        // Draw metal arrowhead
        const arrowheadSize = 8;
        const arrowheadAngle = Math.PI / 8; // 22.5 degrees for sharper point
        animations.beginPath();
        animations.fillStyle = "#C0C0C0"; // Silver metal arrowhead
        animations.moveTo(currentX, currentY);
        animations.lineTo(currentX + arrowheadSize * Math.cos(angel - arrowheadAngle), currentY + arrowheadSize * Math.sin(angel - arrowheadAngle));
        animations.lineTo(currentX + arrowheadSize * Math.cos(angel + arrowheadAngle), currentY + arrowheadSize * Math.sin(angel + arrowheadAngle));
        animations.closePath();
        animations.fill();
        // Add metal outline for arrowhead
        animations.beginPath();
        animations.strokeStyle = "#808080"; // Darker gray outline
        animations.lineWidth = 1;
        animations.moveTo(currentX, currentY);
        animations.lineTo(currentX + arrowheadSize * Math.cos(angel - arrowheadAngle), currentY + arrowheadSize * Math.sin(angel - arrowheadAngle));
        animations.lineTo(currentX + arrowheadSize * Math.cos(angel + arrowheadAngle), currentY + arrowheadSize * Math.sin(angel + arrowheadAngle));
        animations.closePath();
        animations.stroke();
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
        else {
            // Animation complete
            clearRect(animations);
            inAnimation = false;
            onComplete();
        }
    }
    animate();
}
function canFly(type) {
    switch (type) {
        case "dragon":
        case "angel":
        case "griffin":
            return true;
        case "gargoyle":
        case "vampire":
        case "zombie":
        case "archer":
        case "dendroid":
        case "pikeman":
        case "devil":
        case "enhancedArcher":
        case "ballista":
        case "aidTent":
            return false;
    }
}
function stackSteppingOn({ hex, stack }) {
    if (hex.type !== "fireWall" && hex.type !== "stackFireWall") {
        return Promise.resolve();
    }
    return processActions(magicAttack({
        spell: "fireWall",
        target: stack,
        receiver: stackOwner(stack),
        attacker: stackEnemy(stack),
    }));
}
function move(hex) {
    const stackHex = stackHexFrom(hex);
    if (!stackHex) {
        return;
    }
    const moving = stackHex.moving;
    if (!moving) {
        inAnimation = false;
        return;
    }
    inAnimation = true;
    const current = moving.current;
    const target = moving.target;
    if (canFly(stackHex.stack.type)) {
        current.x += moving.xSpeed;
        current.y += moving.ySpeed;
        drawStackInfo({
            ctx: units,
            x: current.x,
            y: current.y,
            fillStyle: "red",
            stack: stackHex.stack
        });
        if (nearlyEqual(current.x, target.x) && nearlyEqual(current.y, target.y)) {
            forceMove(hex);
            inAnimation = false;
        }
        return;
    }
    const next = moving.path[0];
    if (!next) {
        forceMove(hex);
        inAnimation = false;
        return;
    }
    const { x, y } = normalizedPosition(next, current);
    current.x += x * walkingCoefficient;
    current.y += y * walkingCoefficient;
    drawStackInfo({
        ctx: units,
        x: current.x,
        y: current.y,
        flip: foe().army.includes(stackHex.stack),
        fillStyle: stackHex.stack === selected() ? "red" : undefined,
        stack: stackHex.stack
    });
    if (!nearlyEqual(current.x, next.x) || !nearlyEqual(current.y, next.y)) {
        return;
    }
    const point = stackHex.moving?.path.splice(0, 1)[0];
    if (!point) {
        return;
    }
    const targetHex = hexAtPoint({ ...point, x: point.x })?.hex;
    if (!target || !targetHex) {
        return;
    }
    return stackSteppingOn({ hex: targetHex, stack: stackHex.stack });
}
let inAnimation = false;
function drawStack(hex, x, y) {
    const { moving } = hex;
    if (moving) {
        return;
    }
    drawStackInfo({
        ctx: units,
        x,
        y,
        fillStyle: hex.stack === selected() && !inAnimation ? "red" : "#000",
        flip: foe().army.includes(hex.stack),
        stack: hex.stack
    });
}
function hexIndex(row, column) {
    return hexes.findIndex(i => i.row === row && i.column === column);
}
function removeHex(row, column, replace) {
    const index = hexIndex(row, column);
    if (index === -1) {
        return;
    }
    if (replace) {
        hexes.splice(index, 1, replace);
    }
    else {
        hexes.splice(index, 1);
    }
}
function drawFireWall(hex, x, y, rowIndex, columnIndex, timestamp) {
    const sprite = fireWallAppearSprite;
    const fireY = y - sprite.height;
    const fireX = x + sprite.width / 2;
    if (hex.state === "appearing") {
        const struct = hex.animation;
        onAnimationTick(struct, timestamp);
        if (struct.runout) {
            hex.state = "fires";
            hex.animation = { duration: fireWallDuration, frameCount: fireWallDisappearSprite.count, frame: 0 };
            return;
        }
        availableHexes.drawImage(sprite.image, 
        // xOffset + frame * xOffset + frame * frameWidth,
        struct.frame * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
    }
    else if (hex.state === "fires") {
        const sprite = fireWallSprite;
        const struct = hex.animation;
        onAnimationTick(struct, timestamp);
        if (struct.runout) {
            struct.runout = false;
            struct.frame = 0;
            struct.timer = undefined;
            return;
        }
        availableHexes.drawImage(sprite.image, 
        // xOffset + frame * xOffset + frame * frameWidth,
        struct.frame * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
    }
    else {
        const sprite = fireWallDisappearSprite;
        const struct = hex.animation;
        onAnimationTick(struct, timestamp);
        if (struct.runout) {
            const hex = hexAtRowColumn(rowIndex, columnIndex);
            if (!hex) {
                return;
            }
            const type = hex.type;
            switch (type) {
                case "stackFireWall":
                    return removeHex(rowIndex, columnIndex, hex.stackHex);
                case "obstacle":
                case "empty":
                case "stack":
                case "fireWall":
                    return removeHex(rowIndex, columnIndex);
                default:
                    never(type);
            }
        }
        availableHexes.drawImage(sprite.image, 
        // xOffset + frame * xOffset + frame * frameWidth,
        struct.frame * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
    }
}
function drawElements(timestamp) {
    clearRect(units);
    hexes.forEach(hex => {
        const { row, column } = hex;
        let x = columnHexX(row, column);
        let y = rowY(row);
        const type = hex.type;
        switch (type) {
            case "obstacle": {
                const kind = hex.kind;
                const kindType = kind.type;
                switch (kindType) {
                    case "default": {
                        // Draw obstacle using existing hex drawing system
                        prepareAvailableHexAt({ row: row, column: column, type: "attackable" });
                        availableHexes.fillStyle = "#b57400";
                        return availableHexes.fill();
                    }
                    case "forceField": {
                        const sprite = forceFieldAppearance;
                        const fireY = y - sprite.height * .8;
                        const fireX = x;
                        if (kind.state === "appearing") {
                            const struct = kind.animation;
                            onAnimationTick(struct, timestamp);
                            if (struct.runout) {
                                kind.state = "exists";
                                kind.animation = { duration: forceFieldDuration, frameCount: forceFieldExists.count, frame: 0 };
                                return;
                            }
                            availableHexes.drawImage(sprite.image, 
                            // xOffset + frame * xOffset + frame * frameWidth,
                            struct.frame * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
                        }
                        else if (kind.state === "exists") {
                            const sprite = forceFieldExists;
                            const struct = kind.animation;
                            onAnimationTick(struct, timestamp);
                            if (struct.runout) {
                                struct.runout = false;
                                struct.frame = 0;
                                struct.timer = undefined;
                                return;
                            }
                            availableHexes.drawImage(sprite.image, 
                            // xOffset + frame * xOffset + frame * frameWidth,
                            (sprite.countOffset + struct.frame) * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
                        }
                        else {
                            const sprite = forceFieldDisappearance;
                            const struct = kind.animation;
                            onAnimationTick(struct, timestamp);
                            if (struct.runout) {
                                return removeHex(row, column);
                            }
                            availableHexes.drawImage(sprite.image, 
                            // xOffset + frame * xOffset + frame * frameWidth,
                            (sprite.countOffset + struct.frame) * sprite.width, 0, sprite.width, sprite.height, fireX, fireY, sprite.width, sprite.height);
                        }
                        return;
                    }
                    default:
                        return never(kindType);
                }
            }
            case "empty":
                return;
            case "stack":
                return drawStack(hex, x, y);
            case "fireWall":
                return drawFireWall(hex, x, y, row, column, timestamp);
            case "stackFireWall":
                drawFireWall(hex.fireWall, x, y, row, column, timestamp);
                return drawStack(hex.stackHex, x, y);
            default:
                never(type);
        }
    });
    clearRect(deadUnits);
    hexesOfDead.forEach(item => {
        const { row, column } = item;
        const hex = hexAtRowColumn(row, column);
        if (!hex) {
            return;
        }
        if (hex.type !== "stack")
            return;
        const x = columnHexX(row, column);
        const y = rowY(row);
        drawStackInfo({
            ctx: deadUnits,
            x,
            y,
            fillStyle: 'gray',
            stack: hex.stack
        });
    });
}
function drawImage(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh, cloned) {
    try {
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    catch (e) {
        let v = 123;
    }
    if (cloned) {
        const old = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(31,31,255,0.5)";
        ctx.fillRect(dx, dy, dw, dh);
        ctx.globalCompositeOperation = old;
    }
}
function drawStackInfo({ stack, flip, ctx, fillStyle, x, y }) {
    const originStack = stack;
    stack = toRealStack(stack);
    const drawX = x;
    const drawY = y - hexHeight;
    ctx.save();
    if (flip) {
        ctx.translate(drawX + hexWidth, 0);
        ctx.scale(-1, 1);
        // Adjust drawX since we've already translated
        x = 0;
    }
    const cloned = originStack.type === "clone";
    switch (stack.type) {
        case "dragon": {
            const width = dragonSprite.width;
            const sprite = dragonSprite;
            drawImage(ctx, sprite.image, currentFrame * width, 25, width, sprite.height, x - width / 3 - (stackOwner(stack) === ally() ? hexWidth : 0), drawY - sprite.height * .4, width * 1.3, sprite.height * 1.3, cloned);
            break;
        }
        case "ballista": {
            const width = ballistaSprite.width;
            drawImage(ctx, ballistaSprite.image, width, ballistaSprite.height + 25, width, ballistaSprite.height, x, drawY, width, ballistaSprite.height, cloned);
            break;
        }
        case "aidTent": {
            const sprite = aidTentSprite;
            const width = sprite.width;
            drawImage(ctx, sprite.image, sprite.gap * currentFrame + currentFrame * width, sprite.height + 40, width, sprite.height, x - sprite.width / 4, drawY, width, sprite.height, cloned);
            break;
        }
        case "archer": {
            const width = archerSprite.width;
            const addHeight = archerSprite.height * .3;
            const addWidth = archerSprite.width * .3;
            drawImage(ctx, archerSprite.image, archerSprite.offset + currentFrame * archerSprite.gap + currentFrame * width, archerSprite.height + 25, width, archerSprite.height, x - addWidth / 2, drawY - addHeight, width + addWidth, archerSprite.height + addHeight, cloned);
            break;
        }
        case "dendroid": {
            const width = dendroidSprite.width;
            drawImage(ctx, dendroidSprite.image, dendroidSprite.offset + currentFrame * dendroidSprite.gap + currentFrame * width, 3 * (dendroidSprite.height + 30), width, dendroidSprite.height, x, drawY - 10, width, dendroidSprite.height, cloned);
            break;
        }
        case "angel": {
            const width = angelSprite.width;
            drawImage(ctx, angelSprite.image, currentFrame * angelSprite.gap + currentFrame * width, angelSprite.height, width, angelSprite.height, x - 15, drawY - 10, width, angelSprite.height, cloned);
            break;
        }
        default: {
            drawText({
                ctx,
                text: stack.type,
                x: x + hexHalfWidth,
                y: y - hexHeight * 0.4,
                fillStyle,
            });
            break;
        }
    }
    ctx.restore();
    if (unitKind(stack) !== "machine") {
        drawText({
            ctx,
            text: toRealStack(stack).count,
            x: drawX + hexHalfWidth,
            y: y,
            fillStyle: "#fff",
            strokeStyle: stack === selected() ? "red" : "green",
            lineWidth: 1,
        });
    }
}
function prepareAvailableHexAt(position) {
    let angelDeg = startAngleDeg;
    let y = rowY(position.row);
    let x = rowX(position.row, position.column);
    availableHexes.beginPath();
    for (let i = 0; i < pointInHex; i++) {
        const end = drawLineAtAngle({
            ctx: availableHexes,
            x0: x,
            y0: y,
            angelDeg,
            movePrevious: false
        });
        x = end.x;
        y = end.y;
        angelDeg = (angelDeg + 60) % 360;
    }
    availableHexes.closePath();
}
function currentSide() {
    return stackOwner(selected());
}
function currentSidePlaying() {
    return currentSideName() === playingSideName;
}
function drawAvailableHexes(hexes) {
    clearRect(availableHexes);
    if (!currentSidePlaying()) {
        return;
    }
    hexes.forEach(hex => {
        prepareAvailableHexAt(hex);
        // 🟥 fill first
        availableHexes.fillStyle =
            hex.type === "attackable" ? "rgba(255, 0, 0, 0.3)" : "rgba(2, 19, 2, 0.3)";
        availableHexes.fill();
        // 🟩 then stroke — drawn on top, not blended
        availableHexes.lineWidth = hexLineWidth;
        availableHexes.strokeStyle = "#628103";
        availableHexes.stroke();
    });
}
function availableAttackHexes(position) {
    const hexes = availableHexPositionsFrom({
        row: position.row,
        column: position.column,
        radius: movementOf(selected()),
        type: "moveToAttack",
    });
    if (canFire(selected()) && !hasEnemyAround()) {
        hexes.push(...enemyHexes());
    }
    return hexes;
}
function enemyHexes() {
    const hexes = [];
    stackEnemy(selected()).army.forEach(stack => {
        if (unitKind(stack) === "machine") {
            return;
        }
        hexes.push({ ...positionOf(stack), type: "attackable" });
    });
    return hexes;
}
function friendHexes() {
    return currentSide().army.map(positionOf);
}
let previousSelected = undefined;
const ballistaRow = 2;
const allyBallistaPosition = {
    x: rowX(ballistaRow, 0) - ballistaSprite.width,
    y: rowY(ballistaRow),
};
const foeBallistaPosition = {
    x: rowX(ballistaRow, lastColumnIndex) + ballistaSprite.width,
    y: rowY(ballistaRow),
};
const aidTentRow = 4;
const allyAidTentPosition = {
    x: rowX(aidTentRow, 0) - aidTentSprite.width,
    y: rowY(aidTentRow),
};
const foeAidTentPosition = {
    x: rowX(aidTentRow, lastColumnIndex) + aidTentSprite.width,
    y: rowY(aidTentRow),
};
function drawBattlefield(timestamp) {
    const position = positionOf(selected());
    if (game.state.type === "end") {
        drawText({
            ctx: endedContext,
            text: `${sideName(game.state.winner)} WIN`,
            x: endedContext.canvas.width / 2,
            y: endedContext.canvas.height / 2,
            font: "50px Arial",
        });
    }
    if (game.type === "spelling") {
        const spell = game.spell;
        switch (spell) {
            case "fireWall":
            case "forceField":
            case "frostRing":
                drawAvailableHexes([]);
                break;
            case "lightning":
            case "arrow":
            case "slow":
            case "forgetfulness":
                drawAvailableHexes(enemyHexes());
                break;
            case "hast":
            case "bless":
            case "rage":
            case "clone":
            case "hypnotize":
            case "airShield":
            case "antiMagic":
                drawAvailableHexes(friendHexes());
                break;
            default:
                never(spell);
        }
        drawQueue();
    }
    else if (selectedType() === "ballista") {
        drawAvailableHexes(enemyHexes());
        drawQueue();
    }
    else if (selectedType() === "aidTent") {
        drawAvailableHexes(friendHexes());
        drawQueue();
    }
    else if (!inAnimation && position && position.row !== -1) {
        if (!game.moved.includes(selected())) {
            drawAvailableHexes(availableAttackHexes(position));
        }
        drawQueue();
    }
    else {
        drawAvailableHexes([]);
    }
    if (previousSelected !== selected()) {
        if (canFire(selected())) {
            attackTypeBtn.style.display = "";
            game.attackType = { default: "fire" };
            updateAttackBtn();
        }
        else {
            attackTypeBtn.style.display = "none";
            game.attackType = { default: "hand" };
        }
    }
    drawElements(timestamp);
    const allyBallista = ally().army.find(i => i.type === "ballista");
    if (allyBallista) {
        drawStackInfo({
            ctx: units,
            x: allyBallistaPosition.x,
            y: allyBallistaPosition.y,
            fillStyle: "red",
            stack: allyBallista,
        });
    }
    const foeBallista = foe().army.find(i => i.type === "ballista");
    if (foeBallista) {
        drawStackInfo({
            ctx: units,
            x: foeBallistaPosition.x,
            y: foeBallistaPosition.y,
            flip: true,
            fillStyle: "red",
            stack: foeBallista,
        });
    }
    const allyAid = ally().army.find(i => i.type === "aidTent");
    if (allyAid) {
        drawStackInfo({
            ctx: units,
            x: allyAidTentPosition.x,
            y: allyAidTentPosition.y,
            fillStyle: "red",
            stack: allyAid,
        });
    }
    const foeAid = foe().army.find(i => i.type === "aidTent");
    if (foeAid) {
        drawStackInfo({
            ctx: units,
            x: foeAidTentPosition.x - hexWidth / 2,
            y: foeAidTentPosition.y + hexHeight / 4,
            fillStyle: "red",
            stack: foeAid,
            flip: true,
        });
    }
    bookBtn.disabled = currentSidePlaying() && game.heroesCastedSpell.includes(stackOwnerHero(selected()));
    if (game.type === "battle") {
        waitedBtn.disabled = game.waited.includes(selected());
    }
    previousSelected = selected();
}
// endregion
// region battlefield events
function enemyStackAt(clicked) {
    const enemy = stackEnemy(selected());
    const targets = enemy.army.map(i => ({ ...positionOf(i), type: "attackable", target: i }));
    const target = targets.find(i => samePositions(i, clicked))?.target;
    return { enemy, target };
}
function friendStackAt(clicked) {
    const friend = currentSide();
    const targets = friend.army.map(i => ({ ...positionOf(i), type: "attackable", target: i }));
    const target = targets.find(i => samePositions(i, clicked))?.target;
    return { friend, target };
}
function defence() {
    ensureAdded(game.defencedInCurrentRound, selected());
    const current = selected();
    nextTurn();
    ensureAdded(game.moved, current);
}
function wait() {
    const current = selected();
    nextTurn();
    ensureAdded(game.waited, current);
}
function samePositions(left, right) {
    return left.column === right.column && left.row === right.row;
}
// endregion
// region magic book
function bookOpened() {
    return !book.classList.contains("closed-book");
}
function closeBook() {
    book.classList.add("closed-book");
}
function openBook() {
    book.classList.remove("closed-book");
    book.innerHTML = "";
    clearRect(availableHexes);
    clearRect(availableHover);
    currentSide().spells.forEach(spell => {
        const element = document.createElement("div");
        element.classList.add("spell");
        element.innerText = spell;
        element.addEventListener("click", () => {
            closeBook();
            const action = { type: "spellSelected", spell };
            doAction(action);
            broadcastEvent({ type: "action", action });
        });
        book.appendChild(element);
    });
}
function selected() {
    return game.selected;
}
function initializedGame() {
    const ally = makeAlly();
    const foe = makeFoe();
    const selected = gameQueueFor({
        elements: [
            ...mapArmyToQueue(ally, "ally"),
            ...mapArmyToQueue(foe, "foe"),
        ],
        moved: [],
        waited: [],
    })[0];
    return {
        type: "battle",
        selected,
        state: { type: "playing" },
        seed: defaultSeed,
        moved: [],
        defendedAttack: [],
        waited: [],
        morale: [],
        heroesCastedSpell: [],
        defencedInPreviousRound: [],
        defencedInCurrentRound: [],
        attackType: { default: attackTypeOf(selected) },
        ally: ally,
        foe: foe,
    };
}
let lastMs = Date.now();
let framed = 0;
const frameCount = 4;
let periodFrame = 0;
let currentFrame = 0;
let frameTimer = 0;
const frameDuration = 180;
function nextTick(timestamp) {
    if (!frameTimer)
        frameTimer = timestamp;
    const delta = timestamp - frameTimer;
    if (delta >= frameDuration) {
        if (periodFrame < (frameCount - 1)) {
            periodFrame += 1;
            currentFrame += 1;
        }
        else if ((periodFrame + 1) === (frameCount * 2 - 1)) {
            periodFrame = 0;
            currentFrame = 0;
        }
        else {
            currentFrame -= 1;
            periodFrame += 1;
        }
        frameTimer = timestamp;
    }
    drawBattlefield(timestamp);
    requestAnimationFrame(nextTick);
    framed += 1;
    const now = Date.now();
    if (now - lastMs > 1000) {
        lastMs = now;
        fps.innerText = `FPS: ${String(framed)}`;
        framed = 0;
    }
}
function hasEnemyAround() {
    if (unitKind(selected()) === "machine") {
        return false;
    }
    return Boolean(stackHexFor({ excludes: currentSide().army, attacker: selected() }).length);
}
const broadcast = new BroadcastChannel('test_channel');
const playingSideName = (new URL(window.location.href).searchParams.get("side") || "left") === "left" ? "ally" : "foe";
let receivedGame = false;
const actions = [];
async function doBroadcastAction(action, force = false) {
    actions.push(action);
    if (actions.length > 1 && !force) {
        return;
    }
    await doAction(action);
    removeFromArray(actions, action);
    if (actions.length > 0) {
        await doBroadcastAction(actions[0], true);
    }
}
function start() {
    broadcast.onmessage = async (e) => {
        const data = JSOG.parse(e.data);
        const type = data.type;
        switch (type) {
            case "action":
                return doBroadcastAction(data.action);
            case "joined":
                return broadcastEvent({ type: "game", game, hexes, hexesOfDead, ally: ally(), foe: foe() });
            case "game":
                if (receivedGame || data.game.state.type === "end") {
                    return;
                }
                receivedGame = true;
                game = data.game;
                hexes = data.hexes;
                hexesOfDead = data.hexesOfDead;
                return;
            default:
                never(type);
        }
    };
    broadcastEvent({ type: "joined" });
    onTurnStarted();
    requestAnimationFrame(nextTick);
}
backgroundImage.onload = () => {
    const canvas = backgroundContext.canvas;
    backgroundContext.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
};
// endregion
function finished() {
    return game.state.type === "end";
}
battlefield.addEventListener("click", e => {
    const action = actionFromClick(e);
    if (!action) {
        return;
    }
    doAction(action);
    broadcastEvent({ type: "action", action });
});
function broadcastEvent(event) {
    const message = JSOG.stringify(event);
    broadcast.postMessage(message);
}
function actionFromClick(e) {
    if (bookOpened() || inAnimation || !currentSidePlaying() || finished()) {
        return;
    }
    const rect = hexesCanvas.getBoundingClientRect();
    const clicked = hexAtPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    });
    if (!clicked) {
        return;
    }
    const position = { row: clicked.row, column: clicked.column };
    if (game.type === "tactic" && clicked.hex.type === "stack" && stackOwner(clicked.hex.stack) === game.side) {
        return { type: "select", stackPosition: position };
    }
    if (game.type === "spelling") {
        if (hasAntiMagic(stackAtPosition(position))) {
            return;
        }
        return { type: "spelling", spell: game.spell, position: position };
    }
    if (selectedType() === "aidTent") {
        return { type: "tryHealAndNextTurn", stackPosition: position, value: 30 };
    }
    if (canFire(selected()) && currentAttackType() === "fire" && !hasEnemyAround() && enemyStackAt(clicked).target) {
        if (canFireTwice(selected())) {
            return { type: "fireTwiceAt", hexPosition: position };
        }
        return { type: "fireAt", hexPosition: position };
    }
    return { type: "clickAt", targetPosition: clicked, nextSelectedPosition: nextSelectedPosition(clicked) };
}
battlefield.addEventListener("mousemove", e => {
    if (bookOpened() || inAnimation || finished() || !currentSidePlaying()) {
        return;
    }
    const rect = hexesCanvas.getBoundingClientRect();
    const hovered = hexAtPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    });
    if (!hovered || hovered.hex.type === "obstacle") {
        drawCeilHover(undefined);
        return;
    }
    if (game.type === "spelling") {
        const hex = hexAt(hovered);
        if (!hex) {
            return;
        }
        const spell = game.spell;
        if (spell === "frostRing") {
            return drawCeilHover(hovered);
        }
        if (spell === "fireWall" || spell === "forceField") {
            if (hex.type !== "empty") {
                return;
            }
            return drawCeilHover(hovered);
        }
        const stack = stackFromHex(hex);
        if (!stack) {
            clearRect(availableHover);
            return;
        }
        // const isEnemy = realStackEnemy(selected()).army.includes(stack)
        if (hasAntiMagic(stack)) {
            return;
        }
        const isEnemy = realStackEnemy(selected()).army.includes(stack);
        switch (spell) {
            case "lightning":
            case "arrow":
            case "forgetfulness":
            case "hypnotize":
                if (!isEnemy) {
                    return;
                }
                return drawCeilHover(hovered);
            case "slow":
            case "hast":
            case "bless":
            case "rage":
            case "airShield":
            case "antiMagic":
                if (isEnemy) {
                    return;
                }
                return drawCeilHover(hovered);
            case "clone":
                if (isEnemy) {
                    return;
                }
                return drawCeilHover(hovered);
            default:
                never(spell);
        }
    }
    const speed = movementOf(selected());
    const position = positionOf(selected());
    if (position.row === -1) {
        return;
    }
    const items = availableHexPositionsFrom({
        row: position.row,
        column: position.column,
        radius: speed,
        type: "moveToAttack"
    });
    const available = items.find(h => samePositions(h, hovered));
    if (!available) {
        return drawCeilHover(undefined);
    }
    const stack = stackFromHex(hovered.hex);
    if (currentAttackType() === "fire") {
        if (stack && stackOwner(stack) === currentSide()) {
            return drawCeilHover(undefined);
        }
        return drawCeilHover(hovered);
    }
    if (selectedType() === "aidTent") {
        if (stack && stackOwner(stack) !== currentSide()) {
            return drawCeilHover(undefined);
        }
        return drawCeilHover(hovered);
    }
    if (available.type === "attackable") {
        const next = nextSelectedPosition(hovered);
        if (!items.find(h => samePositions(h, next))) {
            return drawCeilHover(undefined);
        }
        return drawCeilHover(next);
    }
    drawCeilHover(available);
});
battlefield.addEventListener("mouseleave", () => {
    clearRect(availableHexes);
    clearRect(availableHover);
});
start();
