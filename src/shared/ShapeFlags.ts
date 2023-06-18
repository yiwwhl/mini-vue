/**
 * 对于 ShapeFlags 来说，它有两个值得关注的价值
 * 1. 统一管理项目中的一些策略，譬如 array_children 这样的类型就可以表示 isArray(children)
 * 2. 性能优秀，位运算的消耗是比较低的，在需要频繁触发条件判断的时候使用有助于减少项目的性能损耗
 *
 * 另外，对于一个普通的 if 判断来说，我们通常需要有两种能力
 * 1. 对 if 判断的对象的修改的能力
 * 2. 对该对象值的查询能力
 * 而这两种能力可以由位运算的 (&) 和 (|) 实现，例如
 * 修改能力：
 *  1000 -> 1001: 1000 | 0001 => 1001，比如当前位已经是一个 element 类型，那么此时我的值为 1000，
 *                但同时我的 children 是 array 类型，此时我只需要 & array_children 便能修改值
 * 查询能力：
 * 	1001 & 1000 -> 1000：该场景则是查询 1001 这个值是否含有 1000 权限
 */

export const enum ShapeFlags {
	ELEMENT = 1,
	STATEFUL_COMPONENT = 1 << 1,
	TEXT_CHILDREN = 1 << 2,
	ARRAY_CHILDREN = 1 << 3
}
