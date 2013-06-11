MisEvent
========

针对JavaScript原型链中的方法，提供`beofre`、`after`、`end`三个时间轴队列，方便组织通过`on`方法带入的监听事件

提供 **Filter** 模式，可强制`on`添加的方法使用`event.next()`进行编排运行

提供 **DEBUG** 模式，可在开发模式下，方便地查看哪些方法被跳过不执行

施行 **final** 的队列管理，即使前面队列被阻断，添加在`end`队列中的方法依然会执行，方便进行一些善后的处理操作

模拟DOM事件机制，同时引入jQuery的设计思想，提供`param`、`one`方法，并在`on`方法中，提供**data**可选参数；方便的`off`方法，可以实现快速的(批量)解绑

`bindFromConfig`方法可以自动从类的初始化参数中，事件绑定设置

启动`autoInitEvent`模式之后，即使方法没有在类初始化时，执行`initEvent`进行转化，也可以轻松实现监听事件的绑定





## Get Started

	var mis = MisEvent(class, config);

mis对象包含如下方法：

`bindFromConfig(obj, objConf)`: 从对象初始化参数中，获取可以绑定的事件，并通过`on`方法写入`before`队列中

`initEvent(methodStr [, methodConf])`: 初始化方法，可设置方法是否施行 **filter** 、 **afterFilter** 模式
（注：多个方法以空格间隔，写入 **methodStr** 可实现批量初始化）






## License

Emitter.js is available under the terms of the [MIT License](./LICENSE.md).