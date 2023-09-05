"use strict";

function* getData()
{
    yield ["* * * * ", false];
    yield ["* * * * * ", true];
    yield ["1 2 3 4 5", true];
    yield ["*/1 */2 */3 */4 */5", true];
    yield ["*/0 */2 */3 */4 */5", false];
    yield ["*/1 */2 */ */4 */5", false];
    yield ["70 * * * *", false];
    yield ["0 0 1 1 0", true];
    yield ["0 24 1 1 0", false];
    yield ["0 0 32 1 0", false];
    yield ["0 0 1 13 0", false];
    yield ["0 0 1 1 7", false];
    yield ["*/99 */99 */99 */99 */99", false];
    yield ["99 99 99 99 99", false];
    yield ["* * * * * *", false];
    yield ["*  * * * *", false];
    yield ["*****", true];
    yield ["a a a a a", false];
    yield ["* * */a * *", false];
    yield ["1 * 3 * */2", true];
    yield ["* */* * * *", false];
    yield ["123456", false];
    yield ["1111111111", false];
    yield ["1111111101", true];
    yield ["*/111***", true];
    yield ["*/111****", false];
    yield ["*/1*/2*/3*/4*/5", true];
    yield ["*/01 */02 */03 */04 */05", true];
    yield ["*/01*/02*/03*/04*/05", true];
    yield ["**/2***", true];
    yield ["**/2*11*      ", true];
    yield ["**/2*22*", false];
    yield ["**2***", false];
    yield ["**2**", true];
    yield ["0/* * * * *", false]
}

module.exports = getData();