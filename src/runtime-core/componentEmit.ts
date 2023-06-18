import { isString } from "../shared/is";
import { camelize, capitalizeTheFirstLetter } from "../shared/utils";

/**
 * 小技巧，这里的 instance 用户是无感知的，是通过在 component 层去 bind 了第一个值。当然这个技巧也可以调整为高阶函数
 */
export function emit(instance, event, ...values) {
	/**
	 * 对于用户侧的实现，需要增加一些错误处理，避免滑丝
	 */
	if (!isString(event))
		return console.warn("the type of event name should be string: ", event), "";

	const { props } = instance;

	const handlerName = `on${capitalizeTheFirstLetter(camelize(event))}`;

	const handler = props[handlerName];
	handler && handler.apply(null, values);
}
