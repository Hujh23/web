import {
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Layout,
  List,
  Pagination,
  Popover,
  Radio,
  Row,
  Typography,
  message,
  Tooltip,
  Image,
  Modal,
} from "antd";
import { Form as WebForm } from "antd";
import React, { useEffect, useState } from "react";
import * as graphql from "@/generated/graphql";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { PageProps } from "..";
const WeeklyPage: React.FC<PageProps> = ({ mode, user }) => {
  const { Meta } = Card;
  const { Content, Footer } = Layout;
  const { Text } = Typography;
  const pageSizes = ["8", "12", "16", "20", "32"];
  const { data: weekly_data } = graphql.useGetWeeklySuspenseQuery();
  const [showSize, setShowSize] = useState(12);
  const [page, setPage] = useState(1);
  const [showMode, setShowMode] = useState("browse");
  const [associatedValue, setAssociatedValue] = useState("");
  const [filterParamList, setFilterParamList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = WebForm.useForm<FieldType>();
  type FieldType = {
    cookie?: string;
    userAgent?: string;
    token?: string;
  };
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    RenewWeekly();
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  useEffect(() => {
    let weekly_sorted: any;
    if (weekly_data) {
      weekly_sorted = [...weekly_data.weekly];
      weekly_sorted.sort((a: any, b: any) => {
        return b.id - a.id;
      });
    }
    if (associatedValue !== "") {
      setFilterParamList([]);
      setFilterParamList(
        weekly_sorted?.filter((item: { title: string | any[] }) => {
          return item.title?.slice(14).indexOf(associatedValue) !== -1;
        }),
      );
    } else {
      setFilterParamList(weekly_sorted);
    }
  }, [associatedValue, weekly_data]);
  const RenewWeekly = async () => {
    try {
      form.submit();
      const paramSet: FieldType = form.getFieldsValue();
      const cookie: string | undefined = paramSet.cookie;
      const userAgent: string | undefined = paramSet.userAgent;
      const token: string | undefined = paramSet.token;
      if (!cookie || !userAgent || !token) throw Error("请填写完整信息");
      const response = await axios.post("/weekly/renew", {
        cookie: cookie,
        useragent: userAgent,
        token: token,
      });
      if (response.status === 200) message.success("spider start");
      else throw Error("start failed");
      const filename: string = response.data["filename"];
      let count = 0;
      let success: boolean = false;
      //const limit = 10;
      while (count < 60) {
        const response = await axios.post("/weekly/check", {
          filename: filename,
        });
        if (response.data.finished === true) {
          message.success("spider finished");
          success = true;
          break;
        }
        if (response.data.failed === true) {
          throw Error("spider failed");
        }
        count++;
        //per second
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
      if (!success) throw Error("spider timeout");
      else console.log("success");
    } catch (err) {
      message.error(String(err));
    }
  };
  const onChange = (pageNumber: number, pageSize?: number) => {
    setPage(pageNumber);
    if (pageSize) setShowSize(pageSize);
  };
  const MyCard = (props: any) => {
    const [visibleInsert, setVisibleInsert] = useState(false);
    const [visibleDelete, setVisibleDelete] = useState(false);
    return (
      <Tooltip title={props.item.title.split("|")[1]}>
        <Card
          hoverable={true}
          cover={<Im src={props.item.url} />}
          actions={showAction(
            setVisibleInsert,
            setVisibleDelete,
            visibleInsert,
            visibleDelete,
            props.item,
          )}
        >
          <Meta
            avatar={<Avatar src={`/android-chrome-192x192.png`} />}
            title={
              <Text>
                {props.item.title.split("|")[0]} <br />{" "}
                {props.item.title.split("|")[1]}
              </Text>
            }
          />
        </Card>
      </Tooltip>
    );
  };
  const Im = (props: any) => {
    const [url, setUrl] = useState("/android-chrome-192x192.png");
    fetch_img(props.src, setUrl);
    return (
      <Image
        alt="weekly cover"
        src={url}
        referrerPolicy="no-referrer"
        preview={false}
        style={{
          objectFit: "cover",
          minHeight: 256,
          borderRadius: "10px",
        }}
        onClick={() => {
          const w = window.open("loading");
          if (w != null) w.location.href = props.src;
        }}
      />
    );
  };
  const InsertPop = (props: any) => {
    const [inputURL, setInputURL] = useState("");
    return (
      <Layout>
        <Input
          placeholder="请输入要添加的推送链接"
          style={{ marginBottom: 10 }}
          value={inputURL}
          onChange={(e) => setInputURL(e.target.value)}
        />
        <table style={{ margin: "0 auto" }}>
          <tbody>
            <tr>
              <td>
                <Button
                  type="primary"
                  size="small"
                  onClick={async () => {
                    try {
                      const response = await axios.post("/weekly/insert", {
                        id: props.id,
                        url: inputURL,
                      });
                      if (response.status === 200)
                        message.success("推送添加成功！");
                      else throw Error("Insert failed");
                    } catch (err) {
                      console.log(err);
                      message.error("推送添加失败！");
                    }
                  }}
                >
                  提交
                </Button>
              </td>
              <td>
                <Button
                  style={{ marginLeft: 10 }}
                  size="small"
                  onClick={() => {
                    props.setVisibleInsert(false);
                  }}
                >
                  取消
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Layout>
    );
  };
  const DeletePop = (props: any) => {
    return (
      <Layout>
        <table style={{ margin: "0 auto" }}>
          <tbody>
            <tr>
              <td>
                <Button
                  type="primary"
                  size="small"
                  onClick={async () => {
                    try {
                      const response = await axios.post("/weekly/delete", {
                        id: props.id,
                      });
                      if (response.status === 200)
                        message.success("推送删除成功！");
                      else throw Error("Delete failed");
                    } catch (err) {
                      console.log(err);
                      message.error("推送删除失败！");
                    }
                  }}
                >
                  删除
                </Button>
              </td>
              <td>
                <Button
                  style={{ marginLeft: 10 }}
                  size="small"
                  onClick={() => {
                    props.setVisibleDelete(false);
                  }}
                >
                  取消
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Layout>
    );
  };
  const showAction = (
    setVisibleInsert: any,
    setVisibleDelete: any,
    visibleInsert: any,
    visibleDelete: any,
    item: any,
  ) => {
    if (showMode === "edit") {
      return [
        <Popover
          content={
            <InsertPop setVisibleInsert={setVisibleInsert} id={item.id} />
          }
          title="添加新推送到本条推送前"
          trigger="click"
          open={visibleInsert}
          onOpenChange={(newVisible: boolean) => {
            setVisibleInsert(newVisible);
          }}
          arrow={{ pointAtCenter: true }}
        >
          <PlusCircleOutlined
            onClick={() => {
              setVisibleInsert(true);
            }}
          />
        </Popover>,
        <Popover
          content={
            <DeletePop setVisibleDelete={setVisibleDelete} id={item.id} />
          }
          title="删除本条推送"
          trigger="click"
          open={visibleDelete}
          onOpenChange={(newVisible: boolean) => {
            setVisibleDelete(newVisible);
          }}
          arrow={{ pointAtCenter: true }}
        >
          <MinusCircleOutlined
            onClick={() => {
              setVisibleDelete(true);
            }}
          />
        </Popover>,
      ];
    } else return undefined;
  };
  const fetch_img = async (url: string, setUrl: any) => {
    try {
      const response = await axios.get("/weekly/cover", {
        params: {
          url: url,
        },
      });
      setUrl(response.data);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <Layout>
      <Content
        style={{
          marginLeft: 50,
          marginTop: 50,
          marginRight: 50,
          minHeight: 380,
        }}
      >
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Input
              style={{ marginBottom: 50 }}
              value={associatedValue}
              onChange={(e) => {
                setAssociatedValue(e.target.value?.trim());
              }}
              placeholder="  Weekly Title"
              allowClear
              prefix={<SearchOutlined />}
            ></Input>
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 4,
              xxl: 6,
            }}
            dataSource={filterParamList?.slice(
              showSize * (page - 1),
              showSize * page,
            )}
            renderItem={(item: any) => (
              <List.Item>
                <MyCard item={item} />
              </List.Item>
            )}
          />
        </Row>
      </Content>
      {user?.role === "counselor" && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Button
            //onClick={RenewWeekly}
            //disabled={user?.role !== "counselor" && user?.role !== "admin"}
            onClick={showModal}
          >
            刷新weekly内容
          </Button>
          <Modal
            title="刷新 weekly 内容"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            <WebForm
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 600 }}
              initialValues={{ remember: true }}
              autoComplete="off"
              form={form}
            >
              <WebForm.Item<FieldType>
                label="Cookie"
                name="cookie"
                rules={[{ required: true, message: "请输入内容" }]}
              >
                <Input />
              </WebForm.Item>

              <WebForm.Item<FieldType>
                label="UserAgent"
                name="userAgent"
                rules={[{ required: true, message: "请输入内容" }]}
              >
                <Input />
              </WebForm.Item>
              <WebForm.Item<FieldType>
                label="Token"
                name="token"
                rules={[{ required: true, message: "请输入内容" }]}
              >
                <Input />
              </WebForm.Item>

              <WebForm.Item label={null}></WebForm.Item>
            </WebForm>
          </Modal>
        </div>
      )}
      <Footer>
        <table style={{ margin: "0 auto" }}>
          <tbody>
            <tr className="view-and-admin-mode">
              <td title="仅系统管理员在登录后可进入编辑模式">
                <Radio.Group
                  defaultValue={"browse"}
                  value={showMode}
                  onChange={(e) => setShowMode(e.target.value)}
                >
                  <Radio.Button value="browse">浏览模式</Radio.Button>
                  <Radio.Button
                    value="edit"
                    disabled={user.role !== "counselor"}
                  >
                    编辑模式
                  </Radio.Button>
                </Radio.Group>
              </td>
              <td>
                <Pagination
                  showQuickJumper
                  current={page}
                  total={weekly_data?.weekly.length}
                  defaultPageSize={12}
                  showSizeChanger={true}
                  pageSizeOptions={pageSizes}
                  pageSize={showSize}
                  onChange={onChange}
                  style={{ marginLeft: 20 }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Footer>
    </Layout>
  );
};
export default WeeklyPage;
