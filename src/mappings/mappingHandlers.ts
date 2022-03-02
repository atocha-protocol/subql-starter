import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {
    PuzzleCreatedEvent,
    AnswerCreatedEvent,
    ChallengeDepositEvent,
    ChallengeStatusChangeEvent,
    PuzzleStatusChangeEvent, TakeTokenRewardEvent, TakePointRewardEvent, PuzzleDepositEvent
} from "../types";
import {Balance, BlockNumber} from "@polkadot/types/interfaces";


export async function handlePuzzleCreatedEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [who, puzzle_hash, create_bn, deposit]}} = event;
    const record = new PuzzleCreatedEvent(puzzle_hash.toHuman().toString());
    record.who = who.toString();
    record.puzzle_hash = puzzle_hash.toHuman().toString();
    record.create_bn = BigInt(create_bn.toString());
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.owner_deposit = (deposit as Balance).toBigInt();
    await record.save();
}

export async function handleAnswerCreatedEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [who, answer_content, puzzle_hash, create_bn, result_type]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new AnswerCreatedEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.who = who.toString();
    record.answer_content = answer_content.toHuman().toString();
    record.create_bn = BigInt(create_bn.toString());
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_hash = puzzle_hash.toHuman().toString();
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.result_type = result_type.toHuman().toString();
    await record.save();
}

export async function handleChallengeDepositEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, who, deposit, deposit_type]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new ChallengeDepositEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.who = who.toString();
    record.puzzle_hash = puzzle_hash.toHuman().toString();
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.deposit = (deposit as Balance).toBigInt();
    record.deposit_type = deposit_type.toHuman().toString();
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    await record.save();
}

export async function handleChallengeStatusChangeEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, stauts_info]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new ChallengeStatusChangeEvent(`${event.block.block.header.number.toString()}-${event.idx}`);

    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    logger.info(`request_data C::#### ${stauts_info.toString()}, ${stauts_info.toHuman()}`);
    for(const key in stauts_info.toHuman() as any) {
        record.challenge_status = key;
        // logger.info(`stauts_info..toJSON()()[key] = ${(stauts_info.toHuman()[key] as Balance).toBigInt()}`, );
        let change_bn = stauts_info.toHuman()[key].replace(',','');
        record.change_bn = BigInt(change_bn);
    }
    // logger.info(`record = ${record}`);
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    await record.save();
}


export async function handlePuzzleStatusChangeEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, stauts_info]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new PuzzleStatusChangeEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.puzzle_status = stauts_info.toString();
    await record.save();
}

// handleTakeTokenRewardEvent
export async function handleTakeTokenRewardEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, take_token, fee]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new TakeTokenRewardEvent(`${puzzle_hash.toHuman().toString()}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.token = (take_token as Balance).toBigInt();
    record.fee = (fee as Balance).toBigInt();
    await record.save();
}

export async function handleTakePointRewardEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, take_token, fee]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new TakePointRewardEvent(`${puzzle_hash.toHuman().toString()}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.point = (take_token as Balance).toBigInt();
    record.fee = (fee as Balance).toBigInt();
    await record.save();
}

// handleAdditionalSponsorshipEvent rename to handlePuzzleDepositEvent
export async function handlePuzzleDepositEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, who, deposit, tip]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new PuzzleDepositEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.who = who.toString();
    record.deposit = (deposit as Balance).toBigInt();
    record.tip = tip?tip.toHuman().toString():'';
    await record.save();
}

async function makeSurePuzzleCreated(puzzle_hash:string):Promise<void> {
    let puzzleCreated = await PuzzleCreatedEvent.get(puzzle_hash);
    if(!puzzleCreated) {
        puzzleCreated = new PuzzleCreatedEvent(puzzle_hash);
        puzzleCreated.puzzle_hash = puzzle_hash;
        await puzzleCreated.save();
    }
}


