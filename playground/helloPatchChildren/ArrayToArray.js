import { ref, h } from "../../lib/mini-vue.esm.js";

/**
 * 双端 diff 算法的核心思想
 *  通过双端比较，缩小最终 array to array 的对比范围
 * 基于此思想，我们在缩小对比范围的阶段首先需要先实现
 * 1. 左侧的对比
 *  实际上该对比过程涉及 3 个指针，以 (ab)c 和 (ab)de 为例，指向 abc 末尾的指针成为 e1, 指向 abde 末尾的指针成为 e2
 * 指向 abde 开头的指针成为 i，遍历数组，当对应位置值相等时，i 指针向后移动，直到不相等后找到左侧的起点
 */

/**
 * 左侧的对比
 * (a b) c
 * (a b) d e
 */

// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C")
// ];

// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E")
// ];

/**
 * 右侧的对比
 * a(bc)
 * de(bc)
 */

// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C")
// ];

// const nextChildren = [
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C")
// ];

/**
 * 新的比老的长时，需要创新新的节点
 *
 * 左侧对比
 * (ab)
 * (ab)cd
 * i = 2, e1=1, e2 = 3
 */

// const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// 	h("p", { key: "D" }, "D")
// ];

/**
 * 新的比老的长，需要创建新的节点
 * 右侧对比
 * (ab)
 * dc(ab)
 * i = 0, e1 = -1, e2 = 1
 */

const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

const nextChildren = [
	h("p", { key: "D" }, "D"),
	h("p", { key: "C" }, "C"),
	h("p", { key: "A" }, "A"),
	h("p", { key: "B" }, "B")
];

/**
 * 左侧对比，老的比新的长，删除老的
 * (ab)c
 * (ab)
 * i = 2, e1 = 2, e2 = 1
 */

// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C")
// ];

// const nextChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

/**
 * 右侧
 * a(bc)
 * (bc)
 * i = 0, e1 = 0, e2 = -1
 */

// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C")
// ];

// const nextChildren = [h("p", { key: "B" }, "B"), h("p", { key: "C" }, "C")];

export default {
	name: "ArrayToText",
	setup() {
		const isChange = ref(false);
		window.isChange = isChange;

		return {
			isChange
		};
	},
	render() {
		const self = this;
		return self.isChange === true
			? h("div", {}, nextChildren)
			: h("div", {}, prevChildren);
	}
};
