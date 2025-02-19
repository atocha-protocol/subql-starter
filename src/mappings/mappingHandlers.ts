import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {
    PuzzleCreatedEvent,
    AnswerCreatedEvent,
    ChallengeDepositEvent,
    ChallengeStatusChangeEvent,
    PuzzleStatusChangeEvent,
    TakeTokenRewardEvent,
    TakePointRewardEvent,
    PuzzleDepositEvent,
    AnnouncePuzzleChallengeDeadlineEvent, ChallengeRaisePeriodDeadlineEvent, AtochaUserStruct
} from "../types";
import {Balance, BlockNumber} from "@polkadot/types/interfaces";


export async function handlePuzzleCreatedEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [who, puzzle_hash, create_bn, deposit]}} = event;
    await makeAtochaUserStruct(who.toString())
    let record = await PuzzleCreatedEvent.get(puzzle_hash.toHuman().toString());
    if(!record){
        record = new PuzzleCreatedEvent(puzzle_hash.toHuman().toString());
        record.dyn_challenge_deadline = BigInt(0);
        record.dyn_raise_deadline = BigInt(0);
        record.dyn_have_matched_answer = false;
        record.dyn_total_deposit = BigInt(0);
        record.dyn_challenge_status = 'Raise';
        record.dyn_puzzle_status = 'PUZZLE_STATUS_IS_SOLVING';
    }
    record.whoId = who.toString();
    record.puzzle_hash = puzzle_hash.toHuman().toString();
    record.create_bn = BigInt(create_bn.toString());
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.owner_deposit = (deposit as Balance).toBigInt();
    await record.save();
}

export async function handleAnswerCreatedEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [who, answer_content, puzzle_hash, create_bn, result_type]}} = event;
    await makeAtochaUserStruct(who.toString())
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString(), who.toString());
    const record = new AnswerCreatedEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.whoId = who.toString();
    record.answer_content = answer_content.toHuman().toString();
    record.create_bn = BigInt(create_bn.toString());
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_hash = puzzle_hash.toHuman().toString();
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.result_type = result_type.toHuman().toString();
    if(record.result_type == 'ANSWER_HASH_IS_MATCH'){
        let puzzle_create_event = await PuzzleCreatedEvent.get(puzzle_hash.toHuman().toString());
        puzzle_create_event.dyn_have_matched_answer = true;
        await puzzle_create_event.save();
    }
    await record.save();
}

export async function handleChallengeDepositEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, who, deposit, deposit_type]}} = event;
    await makeAtochaUserStruct(who.toString())
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString(), who.toString());
    const record = new ChallengeDepositEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.whoId = who.toString();
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
    const puzzle_obj = await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new ChallengeStatusChangeEvent(`${event.block.block.header.number.toString()}-${event.idx}`);

    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    logger.info(`request_data C::#### ${stauts_info.toString()}, ${stauts_info.toHuman()}`);
    for(const key in stauts_info.toHuman() as any) {
        record.challenge_status = key;
        // logger.info(`stauts_info..toJSON()()[key] = ${(stauts_info.toHuman()[key] as Balance).toBigInt()}`, );
        // let change_bn = stauts_info.toHuman()[key].replace(',','');
        // record.change_bn = BigInt(change_bn);
    }
    // logger.info(`record = ${record}`);
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    await record.save();

    if(puzzle_obj.dyn_challenge_status!= 'JudgePassed' && puzzle_obj.dyn_challenge_status!= 'JudgeRejected'){
        puzzle_obj.dyn_challenge_status = record.challenge_status;
    }
    await puzzle_obj.save();
}


export async function handlePuzzleStatusChangeEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, stauts_info]}} = event;
    const puzzle_obj = await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new PuzzleStatusChangeEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.puzzle_status = stauts_info.toString();
    await record.save();
    puzzle_obj.dyn_puzzle_status = record.puzzle_status;
    await puzzle_obj.save();
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
    const {event: {data: [puzzle_hash, who, deposit, tip, kind]}} = event;
    await makeAtochaUserStruct(who.toString())
    const puzzle_obj = await makeSurePuzzleCreated(puzzle_hash.toHuman().toString(), who.toString());
    const record = new PuzzleDepositEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.whoId = who.toString();
    record.deposit = (deposit as Balance).toBigInt();
    record.tip = tip?tip.toHuman().toString():'';
    record.kind = kind?kind.toHuman().toString():'';
    await record.save();

    puzzle_obj.dyn_total_deposit += record.deposit;
    await puzzle_obj.save();
}

//
export async function handleAnnouncePuzzleChallengeDeadlineEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, deadline]}} = event;
    logger.info(`DEBUG call  handleAnnouncePuzzleChallengeDeadlineEvent`);

    // before check AnnouncePuzzleChallengeDeadlineEvent exists
    let announceCheck = await AnnouncePuzzleChallengeDeadlineEvent.get(`${event.block.block.header.number.toString()}-${event.idx}`);
    if(!announceCheck) {
        logger.info(`AnnouncePuzzleChallengeDeadlineEvent Not exists.`);
        await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
        const record = new AnnouncePuzzleChallengeDeadlineEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
        record.puzzle_infoId = puzzle_hash.toHuman().toString();
        record.deadline = BigInt(deadline.toString());
        record.event_bn = BigInt(event.block.block.header.number.toString());
        record.event_hash = event.block.block.hash.toHuman().toString()
        await record.save();

        let puzzle_create_event = await PuzzleCreatedEvent.get(puzzle_hash.toHuman().toString());
        puzzle_create_event.dyn_challenge_deadline = record.deadline;
        await puzzle_create_event.save();
    }else{
        logger.info(`AnnouncePuzzleChallengeDeadlineEvent Yes exists.`);
    }
}

//
export async function handleChallengeRaisePeriodDeadlineEvent(event: SubstrateEvent): Promise<void> {
    const {event: {data: [puzzle_hash, deadline]}} = event;
    await makeSurePuzzleCreated(puzzle_hash.toHuman().toString());
    const record = new ChallengeRaisePeriodDeadlineEvent(`${event.block.block.header.number.toString()}-${event.idx}`);
    record.puzzle_infoId = puzzle_hash.toHuman().toString();
    record.deadline = BigInt(deadline.toString());
    record.event_bn = BigInt(event.block.block.header.number.toString());
    record.event_hash = event.block.block.hash.toHuman().toString()
    await record.save();

    let puzzle_create_event = await PuzzleCreatedEvent.get(puzzle_hash.toHuman().toString());
    puzzle_create_event.dyn_raise_deadline = record.deadline;
    await puzzle_create_event.save();
}

async function makeSurePuzzleCreated(puzzle_hash:string, who: string=''):Promise<PuzzleCreatedEvent> {
    let puzzleCreated = await PuzzleCreatedEvent.get(puzzle_hash);
    if(!puzzleCreated) {
        if(who == '') {
            throw new Error('Can not create new puzzle store')
        }
        await makeAtochaUserStruct(who.toString())
        puzzleCreated = new PuzzleCreatedEvent(puzzle_hash);
        puzzleCreated.whoId = who;
        puzzleCreated.puzzle_hash = puzzle_hash;
        puzzleCreated.dyn_have_matched_answer = false;
        puzzleCreated.dyn_raise_deadline = BigInt(0);
        puzzleCreated.dyn_challenge_deadline = BigInt(0);
        puzzleCreated.dyn_total_deposit = BigInt(0);
        puzzleCreated.dyn_challenge_status = 'Raise';
        puzzleCreated.dyn_puzzle_status = 'PUZZLE_STATUS_IS_SOLVING';
        await puzzleCreated.save();
    }
    return puzzleCreated;
}

async function makeAtochaUserStruct(acc:string):Promise<AtochaUserStruct> {
    logger.info(`makeAtochaUserStruct = ${acc}`);
    let atochaUser = await AtochaUserStruct.get(acc);
    if(!atochaUser) {
        atochaUser = new AtochaUserStruct(acc);
        await atochaUser.save();
    }
    return atochaUser;
}



