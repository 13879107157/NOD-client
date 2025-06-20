// NOD-client/src/pages/App/App.tsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Button, Breadcrumb, Layout, Menu, theme } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { menuItems } from '../../config/routes';
import './App.css';

const { Header, Content, Sider } = Layout;

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    useEffect(() => {
        const checkToken = async () => {
            try {
                await axiosInstance.get('/api/platform-types/1');
            } catch (error) {
                localStorage.removeItem('token');
                navigate('/auth');
            }
        };

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
        } else {
            checkToken();
        }
    }, [navigate]);

    // 监听路由变化，更新菜单选中状态
    useEffect(() => {
        // 查找当前路径匹配的菜单项
        const findMenuItem = (path: string, menuList: MenuProps['items']): MenuProps['items'] => {
            for (const menu of menuList) {
                // @ts-ignore
                if (menu.path === path) {
                    return [menu];
                }
                // @ts-ignore
                if (menu.children) {
                    // @ts-ignore
                    const result = findMenuItem(path, menu.children);
                    if (result.length > 0) {
                        // @ts-ignore
                        return [menu, ...result];
                    }
                }
            }
            return [];
        };

        const pathSegments = location.pathname.split('/').filter(segment => segment);
        let currentPath = '';
        let matchedItems: MenuProps['items'] = [];
        
        // 逐级匹配路径，找到最匹配的菜单项
        for (const segment of pathSegments) {
            currentPath += `/${segment}`;
            const items = findMenuItem(currentPath, menuItems);
            if (items.length > 0) {
                matchedItems = items;
            }
        }

        // 设置选中的菜单项和展开的菜单组
        if (matchedItems.length > 0) {
            // @ts-ignore
            setSelectedKeys([matchedItems[matchedItems.length - 1].key]);
            // @ts-ignore
            setOpenKeys(matchedItems.slice(0, -1).map(item => item.key));
        }
    }, [location.pathname]);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // 处理菜单项点击（只处理没有子菜单的菜单项）
    const handleMenuClick = (e: { key: string }) => {
        const targetMenuItem = menuItems.flatMap((item) => item.children).find((child) => child.key === e.key);
        if (targetMenuItem) {
            navigate(targetMenuItem.path);
        }
    };

    // 处理菜单组展开/折叠
    const handleOpenChange = (newOpenKeys: string[]) => {
        setOpenKeys(newOpenKeys);
    };

    // 递归查找菜单项及其父级菜单项
    const findMenuItemAndParents = (path: string, menuList: MenuProps['items']): MenuProps['items'] => {
        for (const menu of menuList) {
            // @ts-ignore
            if (menu.path === path) {
                return [menu];
            }
            // @ts-ignore
            if (menu.children) {
                // @ts-ignore
                const result = findMenuItemAndParents(path, menu.children);
                if (result.length > 0) {
                    // @ts-ignore
                    return [menu, ...result];
                }
            }
        }
        return [];
    };

    // 生成面包屑项
    const generateBreadcrumbItems = () => {
        const breadcrumbItems = [];

        // 首页面包屑
        breadcrumbItems.push({
            title: 'Home',
            onClick: () => navigate('/')
        });

        const pathSegments = location.pathname.split('/').filter(segment => segment);
        let currentPath = '';
        for (const segment of pathSegments) {
            currentPath += `/${segment}`;
            const menuItemPath = findMenuItemAndParents(currentPath, menuItems);
            // @ts-ignore
            for (const item of menuItemPath) {
                // @ts-ignore
                if (!breadcrumbItems.some((breadcrumb) => breadcrumb.title === item.label)) {
                    breadcrumbItems.push({
                        // @ts-ignore
                        title: item.label,
                        // @ts-ignore
                        onClick: () => navigate(item.path)
                    });
                }
            }
        }

        return breadcrumbItems;
    };

    const breadcrumbItems = generateBreadcrumbItems();

    return (
        <Layout className='layout-mian'>
            <Header style={{ display: 'flex', alignItems: 'center' }}>
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={selectedKeys}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ flex: 1, minWidth: 0 }}
                />
            </Header>
            <Layout>
                <Sider width={200} style={{ background: colorBgContainer }}>
                    <Menu
                        mode="inline"
                        selectedKeys={selectedKeys}
                        openKeys={openKeys}
                        style={{ height: '100%', borderRight: 0 }}
                        items={menuItems}
                        onClick={handleMenuClick}
                        onOpenChange={handleOpenChange} // 添加菜单组展开/折叠事件处理
                    />
                </Sider>
                <Layout style={{ padding: '0 24px 24px' }}>
                    <Breadcrumb
                        items={breadcrumbItems}
                        style={{ margin: '16px 0' }}
                    />
                    <Content
                        style={{
                            padding: 24,
                            margin: 0,
                            minHeight: 280,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            overflow: 'auto',
                        }}
                    >
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default App;