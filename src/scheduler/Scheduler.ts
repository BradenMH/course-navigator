import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {
    private timeslots: TimeSlot[] = ["MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
    "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
    "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
    "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
    "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let roomsWithTimeSlots: boolean[][] = [];
        for (let j = 0; j < rooms.length; ++j) {
            roomsWithTimeSlots.push([]);
            for (let i = 0; i < 15; ++i) {
                roomsWithTimeSlots[j].push(false);
            }
        }
        for (let section of sections) {
            for (let roomNum = 0; roomNum < rooms.length; ++roomNum) {
                for (let j = 0; j < 15; ++j) {
                    if (roomsWithTimeSlots[roomNum][j] === false) {
                        roomsWithTimeSlots[roomNum][j] = true;
                        let toPushToResult: [any, any, any] = [null, null, null];
                        toPushToResult[0](rooms[roomNum]);
                        toPushToResult[1](section);
                        toPushToResult[2](this.timeslots[j]);
                        let toPush: [SchedRoom, SchedSection, TimeSlot] = toPushToResult;
                        result.push(toPush);
                    }
                }
            }
        }
        return result;
    }
}
