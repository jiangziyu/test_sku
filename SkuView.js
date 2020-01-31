import PropTypes                                                           from "prop-types";
import React, {Component}                                                  from "react";
import {StyleSheet, Text, View, Image}                                     from "react-native";
import {color33, color99, colorB1, GlobalStyle, orangeF3, orangeFD, white} from "../../common/GlobalStyle";
import TextUtils                                                           from "../../common/TextUtils";
import DoubleClick
                                                                           from "../../yr_component/data_entry/DoubleClick";
import {SUCCESS}                                                           from "../../net/netwrokCode";
import TipMessage                                                          from "../../component/TipMessage";

/**
 * Desc：通用的sku组件，包含sku的选择逻辑，以及头部的图片和价格数据
 * Created by jiangziyu on 2019/11/1 10:03.
 */

let btnReduce = require('../../assets/ic_jian_b.png');
let btnAdd = require('../../assets/ic_jia.png');

export default class SkuView extends React.Component {
    static defaultProps: {
        productId: null,
        productPic: '',
        defaultPrice: '',
    };
    static propTypes: {
        productId: PropTypes.string,
        productPic: PropTypes.string,
        defaultPrice: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = {
            data: '',//全部数据
            skuList: [],//接口给的sku大类数组
            chosenSku: '',//选中的skuInfo
            chosenList: [],//保存选中的sku大类的每一行的唯一sku的数组，与skuList的长度相同
            skuInfo: [],//接口给的skuInfo
            number: 1,
        };
        this.productPic = this.props.productPic;
        this.defaultPrice = this.props.defaultPrice;
        this.productId = this.props.productId;
    }

    componentDidMount() {
        this._getData();
    }

    _getChosenSkuInfo() {
        return {skuInfo: this.state.chosenSku, number: this.state.number, hasSku: this.state.skuList.length > 0};
    }

    _getData() {
        $api.getItemSku({
            item_id: this.productId,
        })
            .done((result) => {
                if (result.code === SUCCESS) {
                    this.state.skuList = result.data.sku_list;
                    this.state.skuInfo = result.data.sku_info;
                    this.setState({
                        data: result.data,
                        skuList: this.state.skuList,
                        skuInfo: this.state.skuInfo,
                    });
                    this._setDefaultChosenData();
                } else {
                    TipMessage.messageCenter(result.data);
                }
            }, e => {
            })
    }

    _setDefaultChosenData() {
        for (let i in this.state.skuList) {
            this.state.chosenList[i] = this.state.skuList[i].property_value_list[0];
        }
        let info = this._getChosenInfo();

        this.setState({
            chosenList: this.state.chosenList,
            chosenSku: info,
        })
    }

    /**
     * 当前选中的sku的位置
     * @param item
     * @returns {number}
     * @private
     */
    _isChosen(item) {
        let position = -1;
        for (let i in this.state.chosenList) {
            if (!TextUtils.isNull(this.state.chosenList[i]) &&
                item.property_value === this.state.chosenList[i].property_value) {
                position = i;
            }
        }
        return position;
    }

    /**
     * 点击选中或者取消选中
     * @param skuIndex
     * @param item
     * @private
     */
    _chooseOrNot(skuIndex, item) {
        if (!TextUtils.isNull(this.state.chosenList[skuIndex]) &&
            this.state.chosenList[skuIndex].property_value === item.property_value) {
            this.state.chosenList[skuIndex] = null;
        } else {
            this.state.chosenList[skuIndex] = item;
        }
        let info = this._getChosenInfo();
        this.setState({
            chosenList: this.state.chosenList,
            chosenSku: info,
        })
    }

    /**
     * chosenList中保存的sku长度与sku数据的一级分类相等，则说明已经选完sku，可以去获取对应的sku数据，否则，只返回空字符
     * @returns {*}
     * @private
     */
    _getChosenInfo() {
        const {chosenList, skuInfo} = this.state;
        if (chosenList.length === this.state.skuList.length) {
            let arr = [];
            for (let i in chosenList) {
                if (!TextUtils.isNull(chosenList[i])) {
                    arr[i] = chosenList[i];
                } else {
                    break;
                }
            }
            if (arr.length === chosenList.length) {
                for (let i in skuInfo) {
                    let num = 0;
                    for (let j in arr) {
                        if (arr[j].property_value === skuInfo[i].property_value1 || arr[j].property_value === skuInfo[i].property_value2) {
                            num++;
                        }
                    }
                    if (num === arr.length) {
                        return skuInfo[i];
                    }
                }
            }
        }
        return '';
    }

    /**
     * 在当前已选择的sku条件下，其余sku是否可点击
     * @param skuIndex
     * @param item
     * @returns {number}
     * @private
     */
    _enableSkuItem(skuIndex, item) {
        const {chosenList, skuInfo} = this.state;
        let arr = [];//除此行外选中的其他sku
        arr.push(item.property_value);
        let stoke = 0;
        for (let i in chosenList) {
            if (skuIndex !== parseInt(i) && !TextUtils.isNull(chosenList[i])) {
                arr.push(chosenList[i].property_value);
            }
        }
        for (let i in skuInfo) {
            let num = 0;
            for (let j in arr) {
                if (arr[j] === skuInfo[i].property_value1 || arr[j] === skuInfo[i].property_value2) {
                    num++;
                }
            }
            let price = parseInt(skuInfo[i].sku_stock);
            if (num === arr.length && price > stoke) {
                stoke = price;
            }
        }
        return stoke;
    }

    /**
     * sku二级分类
     * @param skuIndex-一级分类的index
     * @param item
     * @param index
     * @returns {*}
     * @private
     */
    _renderSkuItem(skuIndex, item, index) {
        let chosenLinePos = this._isChosen(item);
        let stoke = this._enableSkuItem(skuIndex, item);
        return (
            <DoubleClick
                style={[styles.btnSku, {
                    borderColor: stoke === 0 ? colorB1 : chosenLinePos !== -1 ? orangeF3 : color99,
                    backgroundColor: stoke === 0 ? white : chosenLinePos !== -1 ? orangeFD : white,
                }]}
                onPress={() => stoke > 0 && this._chooseOrNot(skuIndex, item)}
            >
                <Text
                    style={[{
                        fontSize: 14,
                        color: stoke === 0 ? colorB1 : chosenLinePos !== -1 ? orangeF3 : color33
                    }]}>
                    {item.property_name}
                </Text>
            </DoubleClick>
        )
    }

    /**
     * sku一级分类
     * @param skuItem
     * @param skuIndex
     * @returns {*}
     * @private
     */
    _renderSkuLineItem(skuItem, skuIndex) {
        return (
            <View
                style={[GlobalStyle.paddingLeft4, GlobalStyle.paddingRight4]}>
                <Text
                    style={[GlobalStyle.font14clr33, GlobalStyle.paddingLeft15, GlobalStyle.paddingRight15,
                        GlobalStyle.paddingTop7, GlobalStyle.paddingBottom7]}>
                    {skuItem.name}
                </Text>
                <View
                    style={[GlobalStyle.flexHorizontal, {flexWrap: 'wrap'}]}>
                    {
                        !TextUtils.isNull(skuItem.property_value_list) &&
                        skuItem.property_value_list.map((item, index) => this._renderSkuItem(skuIndex, item, index))
                    }
                </View>
            </View>
        )
    }

    /**
     * 数量加减
     * @param isAdd-true加，false减
     * @private
     */
    _addOrReduce(isAdd) {
        if (this.state.skuList.length > 0 && TextUtils.isNull(this.state.chosenSku)) {
            TipMessage.messageCenter("请先选择商品规格");
            return;
        }
        console.log("jzy", parseInt(this.state.chosenSku.sku_stock))
        let num = this.state.number;
        if (num <= 1 && !isAdd) {
            return;
        }
        if (num >= parseInt(this.state.chosenSku.sku_stock) && isAdd) {
            return;
        }
        let addNum = isAdd ? 1 : -1;
        num = num + addNum;
        this.setState({
            number: num,
        })
    }

    render() {
        const {skuList, chosenList, chosenSku} = this.state;
        let chosenSkuStr = [];
        for (let i in chosenList) {
            if (!TextUtils.isNull(chosenList[i])) {
                chosenSkuStr.push(chosenList[i].property_name);
            }
        }
        return (
            <View>
                <View
                    style={[GlobalStyle.flexHorizontal, GlobalStyle.alignItemsEnd,
                        GlobalStyle.paddingTop20, GlobalStyle.paddingLeft12, GlobalStyle.paddingRight12, GlobalStyle.paddingBottom15]}>
                    <Image
                        source={{uri: TextUtils.isNull(chosenSku.sku_pic) ? this.productPic : chosenSku.sku_pic}}
                        style={[GlobalStyle.img100]}/>
                    <View
                        style={[GlobalStyle.marginLeft16]}>
                        <Text>
                            <Text
                                style={[GlobalStyle.font18orangeF3]}>¥</Text>
                            <Text
                                style={[GlobalStyle.font30orangeF3]}>
                                {
                                    TextUtils.isNull(chosenSku.sku_price) ?
                                        this.defaultPrice
                                        :
                                        chosenSku.sku_price
                                }
                            </Text>
                        </Text>
                        <Text
                            style={[GlobalStyle.font12clr33, GlobalStyle.marginTop10]}>
                            {
                                chosenSkuStr.length > 0 &&
                                "已选择“" + chosenSkuStr.join(",") + "”"
                            }

                        </Text>
                    </View>
                </View>
                {
                    skuList.map((item, index) => this._renderSkuLineItem(item, index))
                }
                <View
                    style={[GlobalStyle.flexHorizontal, GlobalStyle.padding12]}>
                    <Text
                        style={[GlobalStyle.font14clr33, GlobalStyle.flex1]}>
                        数量
                    </Text>
                    <View
                        style={[GlobalStyle.flexHorizontal, GlobalStyle.alignItemsCenter]}>
                        <DoubleClick
                            style={[GlobalStyle.btnReduce]}
                            onPress={() => this._addOrReduce(false)}
                        >
                            <Image
                                source={btnReduce}
                                style={{width: 8, height: 1}}/>
                        </DoubleClick>
                        <Text
                            style={[GlobalStyle.font12clr33, GlobalStyle.backgroundF5, GlobalStyle.textNumber]}>
                            {this.state.number}
                        </Text>
                        <DoubleClick
                            style={[GlobalStyle.btnAdd]}
                            onPress={() => this._addOrReduce(true)}
                        >
                            <Image
                                source={btnAdd}
                                style={{width: 8, height: 8}}/>
                        </DoubleClick>
                    </View>
                </View>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    btnSku: {
        borderRadius: 16,
        borderWidth: 1,
        paddingTop: 7,
        paddingBottom: 7,
        paddingLeft: 15,
        paddingRight: 15,
        margin: 8,
    },
});