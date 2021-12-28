/**
 * 
 * @param {*} source 源数组
 * @param {*} count 要取出多少项
 * @param {*} isPermutation 是否使用排列的方式
 * @return {any[]} 所有排列组合,格式为 [ [1,2], [1,3]] ...
 */
const getAllSortList = (source, count, isPermutation = true) => {
    //如果只取一位，返回数组中的所有项，例如 [ [1], [2], [3] ]
    let currentList = source.map((item) => [item]);
    if (count === 1) {
        return currentList;
    }
    let result = [];
    //取出第一项后，再取出后面count - 1 项的排列组合，并把第一项的所有可能（currentList）和 后面count-1项所有可能交叉组合
    for (let i = 0; i < currentList.length; i++) {
        let current = currentList[i];
        //如果是排列的方式，在取count-1时，源数组中排除当前项
        let children = [];
        if (isPermutation) {
            children = getAllSortList(source.filter(item => item !== current[0]), count - 1, isPermutation);
        }
        //如果是组合的方法，在取count-1时，源数组只使用当前项之后的
        else {
            children = getAllSortList(source.slice(i + 1), count - 1, isPermutation);
        }
        for (let child of children) {
            result.push([...current, ...child]);
        }
    }
    return result;
}

// let arr = [1, 2, 3];
// const result = getNumbers(arr, 2, false);
// console.log(result);
// //[ [ 1, 2 ], [ 1, 3 ], [ 2, 3 ] ]

// const result2 = getNumbers(arr, 2);
// console.log(result2);
//   //[ [ 1, 2 ], [ 1, 3 ], [ 2, 1 ], [ 2, 3 ], [ 3, 1 ], [ 3, 2 ] ]

module.exports = {
    getAllSortList: getAllSortList,
}
